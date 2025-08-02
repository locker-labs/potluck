const initialDown = { opacity: 0.3, y: 40, filter: 'blur(12px)' }
const initialUp = { opacity: 0.3, y: -40, filter: 'blur(12px)' }
const animate = { opacity: 1, y: 0, filter: 0 }
const exit = { opacity: 0.3, y: 40 }
const transition = { duration: 0.3 }

export { initialUp, initialDown, animate, exit, transition }