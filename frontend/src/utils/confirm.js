import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

export async function confirmAction({ title = 'Are you sure?', text = 'This action cannot be undone.', confirmText = 'Yes', cancelText = 'No', icon = 'warning', confirmButtonColor = '#F37526', cancelButtonColor = '#6c757d' } = {}) {
  const res = await Swal.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor,
    cancelButtonColor,
    reverseButtons: true,
    focusCancel: true,
  })
  return !!res.isConfirmed
}



