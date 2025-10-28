import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

export async function confirmAction({ title = 'Are you sure?', text = 'This action cannot be undone.', confirmText = 'Yes', cancelText = 'Cancel', icon = 'warning' } = {}) {
  const res = await Swal.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusCancel: true,
  })
  return !!res.isConfirmed
}



