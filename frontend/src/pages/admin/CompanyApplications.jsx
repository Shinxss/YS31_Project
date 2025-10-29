import React, { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import { confirmAction } from '@/utils/confirm'

const CompanyApplications = () => {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [errorDetails, setErrorDetails] = useState('')
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const apiUrl = useMemo(() => {
    // Allow a full endpoint override, otherwise build from base URL
    const companiesEndpoint = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_COMPANIES_ENDPOINT)
    if (companiesEndpoint) return companiesEndpoint
    const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || ''
    // Backend route: /api/admin/users/companies
    return `${base}/api/admin/users/companies`
  }, [])

  useEffect(() => {
    let isMounted = true
    async function fetchCompanies() {
      setLoading(true)
      setError('')
      setErrorDetails('')
      try {
        const response = await fetch(apiUrl, { credentials: 'include' })
        const contentType = response.headers.get('content-type') || ''
        if (!response.ok) {
          // Try to read a brief body for context
          const bodyText = await response.text().catch(() => '')
          const snippet = bodyText ? bodyText.slice(0, 300) : ''
          const message = `Failed to fetch companies (${response.status}). URL: ${apiUrl}`
          throw Object.assign(new Error(message), { details: snippet })
        }
        if (!contentType.includes('application/json')) {
          const bodyText = await response.text().catch(() => '')
          const snippet = bodyText ? bodyText.slice(0, 300) : ''
          const message = `Unexpected non-JSON response. URL: ${apiUrl}`
          throw Object.assign(new Error(message), { details: snippet })
        }
        const data = await response.json()
        if (isMounted) {
          setCompanies(Array.isArray(data) ? data : (data?.companies || []))
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load companies')
          setErrorDetails(err?.details || '')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    fetchCompanies()
    return () => {
      isMounted = false
    }
  }, [apiUrl, refreshKey])

  async function confirmAndRun({ title, text, confirmText = 'Yes', run }) {
    const ok = await confirmAction({ title, text, confirmText, icon: 'question' })
    if (!ok) return false
    try {
      await run()
      await Swal.fire({ icon: 'success', title: 'Success', timer: 1200, showConfirmButton: false })
      setRefreshKey((k) => k + 1)
      return true
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'Action failed', text: e?.message || 'Unknown error' })
      return false
    }
  }

  async function handleAccept(company) {
    const id = company._id || company.id
    if (!id) return
    return confirmAndRun({
      title: 'Accept company?',
      text: 'This will mark the company as verified.',
      confirmText: 'Accept',
      run: async () => {
        const resp = await fetch(`${apiUrl}/${id}/verify`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isVerified: true }),
        })
        if (!resp.ok) {
          const t = await resp.text().catch(() => '')
          throw new Error(t || `Request failed: ${resp.status}`)
        }
      },
    })
  }

  async function handleReject(company) {
    const id = company._id || company.id
    if (!id) return
    return confirmAndRun({
      title: 'Reject company?',
      text: 'This will set the company status to Blocked.',
      confirmText: 'Reject',
      run: async () => {
        const resp = await fetch(`${apiUrl}/${id}/status`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'blocked' }),
        })
        if (!resp.ok) {
          const t = await resp.text().catch(() => '')
          throw new Error(t || `Request failed: ${resp.status}`)
        }
      },
    })
  }

  async function handleCancel(company) {
    const id = company._id || company.id
    if (!id) return
    return confirmAndRun({
      title: 'Disable company?',
      text: 'This will set the company status to Disabled.',
      confirmText: 'Disable',
      run: async () => {
        const resp = await fetch(`${apiUrl}/${id}/status`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'disabled' }),
        })
        if (!resp.ok) {
          const t = await resp.text().catch(() => '')
          throw new Error(t || `Request failed: ${resp.status}`)
        }
      },
    })
  }

  async function handleDelete(company) {
    // No backend delete endpoint for companies; show info alert
    await Swal.fire({ icon: 'info', title: 'Delete not available', text: 'There is no delete endpoint for companies.' })
  }

  // Kept for modal
  function formatDate(value) {
    if (!value) return ''
    try {
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return ''
      return d.toLocaleDateString()
    } catch (_) {
      return ''
    }
  }
  
  // New function for list view to match image
  function formatAppliedDate(value) {
    if (!value) return ''
    try {
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return ''
      return `Applied: ${d.toLocaleDateString()}`
    } catch (_) {
      return ''
    }
  }

  function handleView(company) {
    setSelectedCompany(company)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setSelectedCompany(null)
  }

  return (
    // Use a container to constrain width and center, matching the image
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-900">Company Applications</h1>
      <p className="text-lg text-gray-600 mt-1 mb-6">Review and verify pending company applications</p>

      {loading && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
          Loading companies...
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-lg">
          <p className="font-semibold mb-2">{error}</p>
          {errorDetails && (
            <pre className="text-sm bg-red-100 p-3 rounded overflow-auto max-h-48">
              {errorDetails}
            </pre>
          )}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-5 md:p-6">
            <h2 className="text-xl font-semibold text-gray-800">Pending Verification Queue</h2>
            <p className="text-sm text-gray-500">Companies awaiting approval</p>
          </div>

          <div>
            {companies.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No companies found.
              </div>
            )}
            
            {companies.map((c) => (
              <div 
                key={c.id || c._id} 
                className="flex flex-col sm:flex-row justify-between sm:items-center p-5 md:p-6 border-t border-gray-200"
              >
                {/* Company Info */}
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-lg font-semibold text-gray-900">{c.name || c.companyName}</h3>
                  <p className="text-sm text-gray-600">{c.email || c.contactEmail || '-'}</p>
                  <p className="text-sm text-gray-600">{c.location || c.city || c.address || '-'}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatAppliedDate(c.accountCreatedAt || c.createdAt || c.dateCreated || c.created_date)}
                  </p>
                </div>
                
                {/* Action Button */}
                <div>
                  <button 
                    onClick={() => handleView(c)}
                    className="bg-white text-gray-700 font-medium py-2 px-4 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal using Tailwind */}
      {isModalOpen && selectedCompany && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" 
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">
                {selectedCompany.name || selectedCompany.companyName || 'Company Details'}
              </h2>
              <button 
                onClick={closeModal} 
                className="text-gray-400 hover:text-gray-600 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                {/* Simple X icon */}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                
                <strong className="text-sm font-semibold text-gray-700 md:col-span-1">Company Name</strong>
                <div className="text-sm text-gray-800 md:col-span-2">{selectedCompany.name || selectedCompany.companyName || '-'}</div>

                <strong className="text-sm font-semibold text-gray-700 md:col-span-1">Website</strong>
                <div className="text-sm text-gray-800 md:col-span-2">
                  {selectedCompany.website ? (
                    <a href={selectedCompany.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{selectedCompany.website}</a>
                  ) : '-'}
                </div>

                <strong className="text-sm font-semibold text-gray-700 md:col-span-1">Email</strong>
                <div className="text-sm text-gray-800 md:col-span-2">{selectedCompany.email || selectedCompany.contactEmail || '-'}</div>

                <strong className="text-sm font-semibold text-gray-700 md:col-span-1">Industry</strong>
                <div className="text-sm text-gray-800 md:col-span-2">{selectedCompany.industry || '-'}</div>

                <strong className="text-sm font-semibold text-gray-700 md:col-span-1">Location</strong>
                <div className="text-sm text-gray-800 md:col-span-2">{selectedCompany.location || selectedCompany.city || selectedCompany.address || '-'}</div>

                <strong className="text-sm font-semibold text-gray-700 md:col-span-1">Status</strong>
                <div className="text-sm text-gray-800 md:col-span-2 capitalize">{selectedCompany.status || '-'}</div>

                <strong className="text-sm font-semibold text-gray-700 md:col-span-1">Date Joined</strong>
                <div className="text-sm text-gray-800 md:col-span-2">{formatDate(selectedCompany.createdAt || selectedCompany.date || selectedCompany.dateCreated || selectedCompany.created_date)}</div>

                <strong className="text-sm font-semibold text-gray-700 md:col-span-1">Company Description</strong>
                <div className="text-sm text-gray-800 md:col-span-2 whitespace-pre-wrap">{selectedCompany.description || selectedCompany.companyDescription || '-'}</div>

                <strong className="text-sm font-semibold text-gray-700 md:col-span-1">Legal Documents</strong>
                <div className="text-sm text-gray-800 md:col-span-2">
                  {Array.isArray(selectedCompany.legalDocuments) && selectedCompany.legalDocuments.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {selectedCompany.legalDocuments.map((doc, idx) => (
                        <li key={idx}>
                          {doc?.name ? (
                            doc?.url ? <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{doc.name}</a> : doc.name
                          ) : (doc?.url ? <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{doc.url}</a> : String(doc))}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    '-'
                  )}
                </div>

              </div>
            </div>
            
            {/* Modal Footer with Actions */}
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={async () => {
                  const success = await handleReject(selectedCompany);
                  if (success) closeModal();
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Reject
              </button>
              <button
                onClick={async () => {
                  const success = await handleAccept(selectedCompany);
                  if (success) closeModal();
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Accept
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  )
}

export default CompanyApplications