/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                inter: ['Inter', 'ui-sans-serif', 'system-ui'],
            },
            boxShadow: {
                glow: '0 0 25px rgba(79, 70, 229, 0.35)',
            },
        },
    },
    plugins: [],
}
