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

  function handleView(company) {
    setSelectedCompany(company)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setSelectedCompany(null)
  }

  return (
    <div>
      <h1>Company Applications</h1>

      {loading && (
        <p>Loading companies...</p>
      )}

      {!loading && error && (
        <div style={{ color: 'red' }}>
          <p style={{ marginBottom: '4px' }}>{error}</p>
          {errorDetails && (
            <pre style={{ whiteSpace: 'pre-wrap', background: '#fff0f0', padding: '8px', border: '1px solid #ffd6d6', borderRadius: '4px', maxHeight: '200px', overflow: 'auto' }}>
              {errorDetails}
            </pre>
          )}
        </div>
      )}

      {!loading && !error && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>ID</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Company Name</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Industry</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Location</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Date Created</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Status</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '12px' }}>No companies found.</td>
                </tr>
              )}
              {companies.map((c) => (
                <tr key={c.id || c._id}>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: '8px' }}>{c.id || c._id}</td>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: '8px' }}>{c.name || c.companyName}</td>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: '8px' }}>{c.industry || '-'}</td>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: '8px' }}>{c.location || c.city || c.address || '-'}</td>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: '8px' }}>{formatDate(c.accountCreatedAt || c.createdAt || c.dateCreated || c.created_date)}</td>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: '8px' }}>{c.status || '-'}</td>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleView(c)}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && selectedCompany && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', width: '95%', maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ margin: 0 }}>{selectedCompany.name || selectedCompany.companyName || 'Company Details'}</h2>
              <button onClick={closeModal}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
              <div><strong>Company Name</strong></div>
              <div>{selectedCompany.name || selectedCompany.companyName || '-'}</div>

              <div><strong>Website</strong></div>
              <div>
                {selectedCompany.website ? (
                  <a href={selectedCompany.website} target="_blank" rel="noreferrer">{selectedCompany.website}</a>
                ) : '-'}
              </div>

              <div><strong>Email</strong></div>
              <div>{selectedCompany.email || selectedCompany.contactEmail || '-'}</div>

              <div><strong>Industry</strong></div>
              <div>{selectedCompany.industry || '-'}</div>

              <div><strong>Location</strong></div>
              <div>{selectedCompany.location || selectedCompany.city || selectedCompany.address || '-'}</div>

              <div><strong>Status</strong></div>
              <div>{selectedCompany.status || '-'}</div>

              <div><strong>Company Description</strong></div>
              <div>{selectedCompany.description || selectedCompany.companyDescription || '-'}</div>

              <div><strong>Legal Documents</strong></div>
              <div>
                {Array.isArray(selectedCompany.legalDocuments) && selectedCompany.legalDocuments.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    {selectedCompany.legalDocuments.map((doc, idx) => (
                      <li key={idx}>
                        {doc?.name ? (
                          doc?.url ? <a href={doc.url} target="_blank" rel="noreferrer">{doc.name}</a> : doc.name
                        ) : (doc?.url ? <a href={doc.url} target="_blank" rel="noreferrer">{doc.url}</a> : String(doc))}
                      </li>
                    ))}
                  </ul>
                ) : (
                  '-'
                )}
              </div>

              <div><strong>Date</strong></div>
              <div>{formatDate(selectedCompany.createdAt || selectedCompany.date || selectedCompany.dateCreated || selectedCompany.created_date)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompanyApplications
