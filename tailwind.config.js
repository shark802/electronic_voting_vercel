/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs"],
  safelist: [
    'confirm-modal',
    'tablerow',
    'active-nav',
    'active-page',
    'selected-position',
    'hover:bg-blue-100',
    'py-2',
    'border-b-2',
    'text-gray-600',
    'active',
    'inactive',
    'opacity-70',
    'hover:bg-blue-300',
    'hover:bg-gray-300',
    'hover:text-white',
    'hover:rounded-full',
    'rounded-tl-lg',
    'rounded-bl-lg',
    'rounded-br-lg',
    'rounded-tr-lg',
    'loader',
    'z-30',
    'pb-3',
    'mb-10',
    'mb-5',
    'ml-2',
    'w-1/3',
    'w-36',
    'py-12',
    'min-w-12',
    'min-h-8',
    'mt-4',
    'float-right',
    'inline-block',
    'animate-slide-in',
    'animate-slide-out',
    'lg:pl-12',
    'inline'
  ],
  theme: {
    extend: {
      animation: {
        'slide-in': 'slideIn .5s ease-in-out',
        'slide-out': 'slideOut .5s ease-in-out', // Add slide-out animation
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' }, // Move off-screen
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.no-scrollbar': {
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      });
    },
  ],
};
