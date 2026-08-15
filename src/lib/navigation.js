// Site navigation, shared by the header and the footer.
//
// Section links are written as "/#section" rather than "#section" so they work
// from any page: on the home page they smooth-scroll, from another page they
// navigate home and jump to the section.
export const NAVIGATION_ITEMS = [
  { href: '/#about', labelKey: 'about' },
  { href: '/#games', labelKey: 'games' },
  { href: '/donation', labelKey: 'donation' },
  { href: '/#daily-updates', labelKey: 'dailyUpdates', conditional: true }
]
