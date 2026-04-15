/**
 * Simple notification system
 * Shows error notifications to users
 */

import { toast } from "sonner"

/**
 * Show error notification
 * @param {string} message - Error message to display
 * @param {Object} options - Optional configuration
 * @param {string} options.position - Position of notification: 'top-right' (default) or 'top-center'
 */
export function showErrorNotification(message, options = {}) {
  toast.success(message, {
    duration: 1000,
    style: {
      backgroundColor: "#F60808",
      color: "white",
      border: "1px solid #F60808"
    },
    ...options
  })
  // const { position = 'top-right' } = options

  // // Create notification container
  // const notification = document.createElement('div')

  // // Position styles
  // const positionStyles = position === 'top-center'
  //   ? `
  //     top: 24px;
  //     left: 50%;
  //     transform: translateX(-50%);
  //   `
  //   : `
  //     top: 24px;
  //     right: 24px;
  //   `

  // notification.style.cssText = `
  //   position: fixed;
  //   ${positionStyles}
  //   background: linear-gradient(135deg, #fa5252 0%, #e03131 100%);
  //   color: white;
  //   padding: 16px 20px;
  //   border-radius: 12px;
  //   box-shadow: 0 8px 24px rgba(250, 82, 82, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1);
  //   z-index: 10000;
  //   max-width: 520px;
  //   min-width: 320px;
  //   animation: ${position === 'top-center' ? 'slideDownBounce' : 'slideInBounce'} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  //   font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  //   font-size: 14px;
  //   line-height: 1.6;
  //   display: flex;
  //   align-items: center;
  //   gap: 12px;
  //   backdrop-filter: blur(10px);
  //   border: 1px solid rgba(255, 255, 255, 0.2);
  // `

  // // Add animation styles
  // const style = document.createElement('style')
  // style.textContent = `
  //   @keyframes slideInBounce {
  //     0% {
  //       transform: translateX(120%);
  //       opacity: 0;
  //     }
  //     60% {
  //       transform: translateX(-8%);
  //       opacity: 1;
  //     }
  //     80% {
  //       transform: translateX(4%);
  //     }
  //     100% {
  //       transform: translateX(0);
  //     }
  //   }
  //   @keyframes slideOutBounce {
  //     0% {
  //       transform: translateX(0);
  //       opacity: 1;
  //     }
  //     100% {
  //       transform: translateX(120%);
  //       opacity: 0;
  //     }
  //   }
  //   @keyframes slideDownBounce {
  //     0% {
  //       transform: translateX(-50%) translateY(-120%);
  //       opacity: 0;
  //     }
  //     60% {
  //       transform: translateX(-50%) translateY(8%);
  //       opacity: 1;
  //     }
  //     80% {
  //       transform: translateX(-50%) translateY(-4%);
  //     }
  //     100% {
  //       transform: translateX(-50%) translateY(0);
  //     }
  //   }
  //   @keyframes slideUpBounce {
  //     0% {
  //       transform: translateX(-50%) translateY(0);
  //       opacity: 1;
  //     }
  //     100% {
  //       transform: translateX(-50%) translateY(-120%);
  //       opacity: 0;
  //     }
  //   }
  // `
  // document.head.appendChild(style)

  // // Add icon
  // const icon = document.createElement('div')
  // icon.innerHTML = `
  //   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  //     <circle cx="12" cy="12" r="10"></circle>
  //     <line x1="12" y1="8" x2="12" y2="12"></line>
  //     <line x1="12" y1="16" x2="12.01" y2="16"></line>
  //   </svg>
  // `
  // icon.style.cssText = `
  //   flex-shrink: 0;
  //   display: flex;
  //   align-items: center;
  //   justify-content: center;
  //   width: 24px;
  //   height: 24px;
  // `

  // // Add message
  // const messageEl = document.createElement('div')
  // messageEl.textContent = message
  // messageEl.style.cssText = `
  //   flex: 1;
  //   font-weight: 500;
  // `

  // notification.appendChild(icon)
  // notification.appendChild(messageEl)

  // const closeNotification = () => {
  //   notification.style.animation = position === 'top-center'
  //     ? 'slideUpBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
  //     : 'slideOutBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
  //   setTimeout(() => {
  //     notification.remove()
  //     if (document.head.contains(style)) {
  //       document.head.removeChild(style)
  //     }
  //   }, 400)
  // }

  // // Add to DOM
  // document.body.appendChild(notification)

  // // Auto remove after 5 seconds
  // setTimeout(closeNotification, 5000)
}

/**
 * Show success notification
 * @param {string} message - Success message to display
 */
export function showSuccessNotification(message, options = {}) {
  toast.success(message, {
    duration: 1000,
    style: {
      backgroundColor: "#01D201",
      color: "white",
      border: "1px solid #01D201"
    },
    ...options
  })
  // Create notification container
  // const notification = document.createElement('div')
  // notification.style.cssText = `
  //   position: fixed;
  //   top: 24px;
  //   right: 24px;
  //   background: linear-gradient(135deg, #51cf66 0%, #37b24d 100%);
  //   color: white;
  //   padding: 16px 20px;
  //   border-radius: 12px;
  //   box-shadow: 0 8px 24px rgba(55, 178, 77, 0.35), 0 2px 8px rgba(0, 0, 0, 0.1);
  //   z-index: 10000;
  //   max-width: 420px;
  //   min-width: 280px;
  //   animation: slideInBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  //   font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  //   font-size: 14px;
  //   line-height: 1.6;
  //   display: flex;
  //   align-items: center;
  //   gap: 12px;
  //   backdrop-filter: blur(10px);
  //   border: 1px solid rgba(255, 255, 255, 0.2);
  // `

  // // Add animation styles
  // const style = document.createElement('style')
  // style.textContent = `
  //   @keyframes slideInBounce {
  //     0% {
  //       transform: translateX(120%);
  //       opacity: 0;
  //     }
  //     60% {
  //       transform: translateX(-8%);
  //       opacity: 1;
  //     }
  //     80% {
  //       transform: translateX(4%);
  //     }
  //     100% {
  //       transform: translateX(0);
  //     }
  //   }
  //   @keyframes slideOutBounce {
  //     0% {
  //       transform: translateX(0);
  //       opacity: 1;
  //     }
  //     100% {
  //       transform: translateX(120%);
  //       opacity: 0;
  //     }
  //   }
  // `
  // document.head.appendChild(style)

  // // Add icon
  // const icon = document.createElement('div')
  // icon.innerHTML = `
  //   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  //     <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
  //     <polyline points="22 4 12 14.01 9 11.01"></polyline>
  //   </svg>
  // `
  // icon.style.cssText = `
  //   flex-shrink: 0;
  //   display: flex;
  //   align-items: center;
  //   justify-content: center;
  //   width: 24px;
  //   height: 24px;
  // `

  // // Add message
  // const messageEl = document.createElement('div')
  // messageEl.textContent = message
  // messageEl.style.cssText = `
  //   flex: 1;
  //   font-weight: 500;
  // `

  // notification.appendChild(icon)
  // notification.appendChild(messageEl)

  // const closeNotification = () => {
  //   notification.style.animation = 'slideOutBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
  //   setTimeout(() => {
  //     notification.remove()
  //     if (document.head.contains(style)) {
  //       document.head.removeChild(style)
  //     }
  //   }, 400)
  // }

  // // Add to DOM
  // document.body.appendChild(notification)

  // // Auto remove after 3 seconds
  // setTimeout(closeNotification, 3000)
}
