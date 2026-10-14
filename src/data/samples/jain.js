// FICTIONAL sample: all people, venues and dates are invented; dates are NOT muhurat-checked.
// Ritual names/order vary by sect (Shvetambar/Digambar), region and family; have a Jain reader review before client release.
export const jainSample = {
  tradition: 'jain',
  couple: { a: 'Tanvi', b: 'Arhan' },
  full: { a: 'Tanvi Bhandari', b: 'Arhan Chhajed' },
  hosts: 'Shri Vimal Bhandari & Smt. Kusum Bhandari, with Shri Rajendra Chhajed & Smt. Sarita Chhajed',
  tagline: 'with the blessings of our elders, invite you to the wedding of',
  // ISO with offset so the countdown is correct in every timezone.
  date: '2027-03-06T11:15:00+05:30',
  dateLabel: 'Saturday, 6 March 2027',
  timeLabel: '11:15 AM',
  venue: 'Shanti Kalash Bhavan',
  city: 'Ahmedabad, Gujarat',
  mapUrl: 'https://maps.google.com/?q=Ahmedabad',
  rsvpBy: '5 February 2027',
  // Opens with the Tattvartha Sutra maxim (emblem motto); the Navkar Mantra is deliberately not used as decoration.
  invocation: {
    text: 'Parasparopagraho Jivanam',
    script: 'परस्परोपग्रहो जीवानाम्',
    meaning: 'Souls render service to one another.',
  },
  greeting: {
    text: 'Jai Jinendra',
    script: 'जय जिनेन्द्र',
    meaning: 'Victory to the Lord of the Jinas; the customary Jain greeting.',
  },
  story: [
    { year: '2019', title: 'A quiet morning darshan', text: 'They met on the steps of a temple, two families who already knew each other by name.' },
    { year: '2022', title: 'Shared values', text: 'Long conversations about kindness, simple living and the home they hoped to build.' },
    { year: '2025', title: 'With our elders’ blessing', text: 'Both families came together to bless the match and set the date.' },
  ],
  // Exactly 4, chronological; 'wedding' is the main ceremony.
  events: [
    { id: 'lagna-lekhan', name: 'Lagna Lekhan', day: '4 Mar 2027', time: '10:00 AM', place: 'Bhandari Residence', dress: 'Soft whites & pastels', note: 'A small family puja where the auspicious date is fixed and the wedding letter is written.' },
    { id: 'mandap-muhurat', name: 'Mandap Muhurat', day: '5 Mar 2027', time: '9:30 AM', place: 'Shanti Kalash Bhavan', dress: 'Traditional, modest', note: 'A priest-led puja to bless the wedding canopy and the days ahead.' },
    { id: 'wedding', name: 'Wedding', day: '6 Mar 2027', time: '11:15 AM', place: 'Shanti Kalash Bhavan', dress: 'Traditional; white or light shades', note: 'Kanyadaan and Mangal Pheras, with blessings from elders. Pure Jain food will be served.' },
    { id: 'reception', name: 'Reception', day: '6 Mar 2027', time: '7:30 PM', place: 'Shanti Kalash Bhavan', dress: 'Festive, elegant', note: 'An evening to welcome the couple among friends and family.' },
  ],
}
