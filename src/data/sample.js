// Fictional sample content shared by every template so designs compare like-for-like.
// Swap this object (or pass a different one to <Template invite={...} />) to personalise.
export const sample = {
  couple: { a: 'Anaya', b: 'Rohan' },
  full: { a: 'Anaya Mehra', b: 'Rohan Iyer' },
  hosts: 'Together with their families',
  tagline: 'are getting married',
  // ISO with offset so the countdown is correct in every timezone.
  date: '2027-02-13T17:30:00+05:30',
  dateLabel: 'Saturday, 13 February 2027',
  timeLabel: '5:30 PM',
  venue: 'Saffron Court Gardens',
  city: 'Udaipur, Rajasthan',
  mapUrl: 'https://maps.google.com/?q=Udaipur',
  rsvpBy: '15 January 2027',
  story: [
    { year: '2019', title: 'A chai, a rainy Tuesday', text: 'Two strangers shared one umbrella and a very long conversation.' },
    { year: '2022', title: 'Same city, same plan', text: 'They moved in together and learned who really owns the remote.' },
    { year: '2025', title: 'The question', text: 'A sunrise, a borrowed ring box, and a yes before he finished asking.' },
  ],
  events: [
    { id: 'mehendi', name: 'Mehendi', day: '11 Feb 2027', time: '4:00 PM', place: 'Saffron Court Gardens', dress: 'Greens & yellows' },
    { id: 'sangeet', name: 'Sangeet', day: '12 Feb 2027', time: '7:30 PM', place: 'The Lake Pavilion', dress: 'Festive glam' },
    { id: 'wedding', name: 'Wedding', day: '13 Feb 2027', time: '5:30 PM', place: 'Saffron Court Gardens', dress: 'Traditional' },
    { id: 'reception', name: 'Reception', day: '13 Feb 2027', time: '9:00 PM', place: 'The Lake Pavilion', dress: 'Cocktail' },
  ],
  // Pictures for the photo-first designs (components/Photo.jsx). These are local test photos in git-ignored folders
  // (public/bride, groom, couple, background); where a file is missing the design shows its illustrated placeholder.
  photos: {
    bride: '/bride/bride.jpg',
    groom: '/groom/groom.jpg',
    couple: '/couple/couple.jpg',
    background: '/background/background.jpg',
  },
  // Where the faces are in each picture (x% y%), so a frame of any shape keeps them in view (lib/photos.js resolveFocus).
  photoFocus: { bride: '48% 41%', groom: '54% 36%', couple: '46% 28%', background: '47% 36%' },
}
