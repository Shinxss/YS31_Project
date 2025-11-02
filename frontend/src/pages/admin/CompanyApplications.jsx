import React, { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import { confirmAction } from '@/utils/confirm'
import { Search } from 'lucide-react'

const CompanyApplications = () => {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [errorDetails, setErrorDetails] = useState('')
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('name-asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const apiUrl = useMemo(() => {
    const companiesEndpoint = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_COMPANIES_ENDPOINT)
    if (companiesEndpoint) return companiesEndpoint
    const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || ''
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
      text: 'This will keep the company unverified.',
      confirmText: 'Reject',
      run: async () => {
        const resp = await fetch(`${apiUrl}/${id}/verify`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isVerified: false }),
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
    await Swal.fire({ icon: 'info', title: 'Delete not available', text: 'There is no delete endpoint for companies.' })
  }

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

  function getInitials(name) {
    if (!name) return ''
    const words = name.trim().split(/\s+/)
    const initials = words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('')
    return initials
  }

  function handleView(company) {
    setSelectedCompany(company)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setSelectedCompany(null)
  }

  const filteredAndSorted = useMemo(() => {
    let filtered = companies.filter((c) => {
      if (!query) return true
      const q = query.toLowerCase()
      const name = (c.name || c.companyName || '').toLowerCase()
      const email = (c.email || c.contactEmail || '').toLowerCase()
      return name.includes(q) || email.includes(q)
    })

    // Apply sorting
    filtered.sort((a, b) => {
      const nameA = (a.name || a.companyName || '').toLowerCase()
      const nameB = (b.name || b.companyName || '').toLowerCase()
      const dateA = new Date(a.accountCreatedAt || a.createdAt || 0)
      const dateB = new Date(b.accountCreatedAt || b.createdAt || 0)

      switch (sortBy) {
        case 'name-asc':
          return nameA.localeCompare(nameB)
        case 'name-desc':
          return nameB.localeCompare(nameA)
        case 'date-newest':
          return dateB - dateA
        case 'date-oldest':
          return dateA - dateB
        case 'status-asc':
          return (a.status || 'active').localeCompare(b.status || 'active')
        case 'status-desc':
          return (b.status || 'active').localeCompare(a.status || 'active')
        default:
          return 0
      }
    })

    return filtered
  }, [companies, query, sortBy])

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage)
  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSorted.slice(startIndex, endIndex)
  }, [filteredAndSorted, currentPage, itemsPerPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [query, sortBy])

  return (
    // Outer page background and background-card wrapper
    <div>
      <div className="max-w-8xl mx-auto">
        {/* Background Card wrapper (subtle) */}
        <div>
          {/* Inner white content card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h1 className="text-2xl font-semibold text-gray-900">Company Applications</h1>
              <p className="text-sm text-gray-600 mt-1 mb-10">Review and verify pending company applications</p>

              {/* Sort and Search */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4 items-end">
                {/* Search box */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="rounded-lg border border-gray-200 bg-white p-1 shadow-sm flex items-center">
                    <Search className="w-5 h-5 text-gray-400 ml-2 mr-2" />
                    <input
                      type="search"
                      placeholder="Search by company name or email..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-transparent placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Sort Dropdown */}
                <div className="w-64">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="name-asc">Company Name (A-Z)</option>
                    <option value="name-desc">Company Name (Z-A)</option>
                    <option value="date-newest">Application Date (Newest)</option>
                    <option value="date-oldest">Application Date (Oldest)</option>
                    <option value="status-asc">Status (A-Z)</option>
                    <option value="status-desc">Status (Z-A)</option>
                  </select>
                </div>
              </div>

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
                <div className="bg-transparent rounded-lg overflow-hidden">
                  <div>
                    {filteredAndSorted.length === 0 && (
                      <div className="p-6 text-center text-gray-500">
                        No companies found.
                      </div>
                    )}

                    {paginatedCompanies.map((c) => (
                      // Card per company — only card visuals changed, buttons untouched
                      <div key={c.id || c._id} className="mb-4">
                        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                          {/* left: company info */}
                          <div className="flex-1 flex items-center gap-4">
                            {/* Avatar/Profile */}
                            <div className="flex-shrink-0">
                              {c.profileImage ? (
                                <img
                                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/company/${c.profileImage}`}
                                  alt={`${c.name || c.companyName} profile`}
                                  className="w-12 h-12 object-cover border border-gray-200 rounded-md"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-blue-900 flex items-center justify-center text-white font-bold text-lg rounded-md">
                                  {getInitials(c.name || c.companyName)}
                                </div>
                              )}
                            </div>
                            {/* Company details */}
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{c.name || c.companyName}</h3>
                              <p className="text-sm text-gray-600 mt-2">Email: {c.email || c.contactEmail || '-'}</p>
                              <p className="text-sm text-gray-600 mt-2">{formatAppliedDate(c.accountCreatedAt || c.createdAt || c.dateCreated || c.created_date)}</p>
                            </div>
                          </div>

                          {/* right: actions (UNCHANGED) */}
                          <div className="flex-shrink-0 flex items-center gap-3 mt-4 sm:mt-0">
                            <button
                              onClick={() => handleView(c)}
                              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-medium py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSorted.length)} of {filteredAndSorted.length} companies
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'text-white bg-blue-600 border border-blue-600'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal using Tailwind — updated visual to match provided screenshot */}
      {isModalOpen && selectedCompany && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          aria-modal="true"
          role="dialog"
        >
          {/* backdrop */}
          <div className="absolute inset-0 bg-black opacity-50" onClick={closeModal} />

          {/* modal card */}
          <div
            className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl mx-auto overflow-hidden"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            {/* top-right close small icon (floating) */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-500 hover:text-gray-700 shadow"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="px-6 pt-6 pb-2 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">{selectedCompany.name || selectedCompany.companyName || 'Company'}</h2>
              <p className="text-sm text-gray-500 mt-1">Company verification details</p>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              {/* Company Information group */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Company Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600">Company Name</span>
                    <span className="text-sm text-gray-900 font-medium">{selectedCompany.name || selectedCompany.companyName || '-'}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600">Contact Email</span>
                    <span className="text-sm text-gray-900 font-medium">{selectedCompany.email || selectedCompany.contactEmail || '-'}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600">Location</span>
                    <span className="text-sm text-gray-900 font-medium">{selectedCompany.location || selectedCompany.city || selectedCompany.address || '-'}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600">Verified Status</span>
                    <span className="text-sm text-gray-900 font-medium">{(selectedCompany.status === 'verified' || selectedCompany.isVerified) ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents group */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Uploaded Documents</h3>

                {/* Legal Registration Documents */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Legal Registration Document</h4>
                  {Array.isArray(selectedCompany.legalRegistrationDocs) && selectedCompany.legalRegistrationDocs.length > 0 ? (
                    <div className="space-y-3">
                      {selectedCompany.legalRegistrationDocs.map((doc, idx) => {
                        const name = doc?.name || (typeof doc === 'string' ? doc : 'Document')
                        const url = doc?.url || (typeof doc === 'string' ? doc : null)
                        return (
                          <div key={idx} className="flex items-center justify-between border rounded-md p-3 bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center bg-white">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </div>
                              <div className="text-sm text-gray-800">{name}</div>
                            </div>

                            <div className="flex items-center gap-3">
                              {url ? (
                                <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-100 text-sm text-gray-700">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  View Document
                                </a>
                              ) : (
                                <button className="inline-flex items-center px-3 py-2 rounded-md border border-gray-200 bg-white text-sm text-gray-400 cursor-not-allowed">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  N/A
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No documents provided.</div>
                  )}
                </div>

                {/* Tax Identity Documents */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Tax Identity Document</h4>
                  {Array.isArray(selectedCompany.taxIdentityDocs) && selectedCompany.taxIdentityDocs.length > 0 ? (
                    <div className="space-y-3">
                      {selectedCompany.taxIdentityDocs.map((doc, idx) => {
                        const name = doc?.name || (typeof doc === 'string' ? doc : 'Document')
                        const url = doc?.url || (typeof doc === 'string' ? doc : null)
                        return (
                          <div key={idx} className="flex items-center justify-between border rounded-md p-3 bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center bg-white">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </div>
                              <div className="text-sm text-gray-800">{name}</div>
                            </div>

                            <div className="flex items-center gap-3">
                              {url ? (
                                <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-100 text-sm text-gray-700">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  View Document
                                </a>
                              ) : (
                                <button className="inline-flex items-center px-3 py-2 rounded-md border border-gray-200 bg-white text-sm text-gray-400 cursor-not-allowed">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  N/A
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No documents provided.</div>
                  )}
                </div>
              </div>

              {/* Description (optional) */}
              { (selectedCompany.description || selectedCompany.companyDescription) && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Company Description</h3>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{selectedCompany.description || selectedCompany.companyDescription}</div>
                </div>
              )}
            </div>

            {/* Modal Footer - buttons exactly like image (left verify, right reject) */}
            <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between gap-3">
              <div className="flex-1">
                <button
                  onClick={() => { closeModal(); }}
                  className="hidden"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    const ok = await handleAccept(selectedCompany)
                    if (ok) closeModal()
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Verify &amp; Approve Company
                </button>

                <button
                  onClick={async () => {
                    const ok = await handleReject(selectedCompany)
                    if (ok) closeModal()
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompanyApplications
