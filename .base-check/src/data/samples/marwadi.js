// FICTIONAL sample: all people, venues and dates are invented; dates are not muhurat-checked.
// Strict superset of src/data/sample.js (adds tradition, invocation, greeting, event note).
export const marwadiSample = {
  tradition: 'marwadi',
  couple: { a: 'Kavya', b: 'Aditya' },
  full: { a: 'Kavya Ranthal', b: 'Aditya Sonwal' },
  // Elders first, honorifics Shri / Smt.; exact order varies by family.
  hosts: 'Shri Ramesh Ranthal & Smt. Sunita Ranthal, with Shri Mahesh Sonwal & Smt. Kamla Sonwal',
  tagline: 'request your presence and blessings at the wedding of',
  // ISO with offset so the countdown is correct in every timezone.
  date: '2027-03-06T19:30:00+05:30',
  dateLabel: 'Saturday, 6 March 2027',
  timeLabel: '7:30 PM',
  venue: 'Rang Mahal Haveli Gardens',
  city: 'Jaipur, Rajasthan',
  mapUrl: 'https://maps.google.com/?q=Jaipur',
  rsvpBy: '5 February 2027',
  // Script only where research rated it high confidence.
  invocation: {
    text: 'Shri Ganeshaya Namah',
    script: 'श्री गणेशाय नमः',
    meaning: 'Salutations to Shri Ganesha, invoked at the start of every auspicious undertaking.',
  },
  // Medium-confidence phrase: script left null pending family/Rajasthani-speaker review.
  greeting: {
    text: 'Khamma Ghani',
    script: null,
    meaning: 'A respectful Rajasthani greeting of welcome.',
  },
  story: [
    { year: '2019', title: 'Two families, one introduction', text: 'Kavya and Aditya were introduced at a cousin\'s wedding, where their grandmothers discovered a shared hometown.' },
    { year: '2022', title: 'Blessings of the elders', text: 'After many conversations and with the warmth of both families, the elders gave their blessings.' },
    { year: '2025', title: 'The families unite', text: 'With tilak, gifts and sweets, the two families came together in a quiet and joyful Roka.' },
  ],
  // Exactly 4, chronological; main ceremony has id 'wedding'.
  events: [
    { id: 'mehndi', name: 'Mehndi', day: '4 Mar 2027', time: '4:00 PM', place: 'Rang Mahal Haveli Gardens', dress: 'Soft greens & yellows', note: 'Henna and mangal geet with the women of both families.' },
    { id: 'geet', name: 'Geet Samelan', day: '5 Mar 2027', time: '7:30 PM', place: 'The Courtyard Hall', dress: 'Festive Rajasthani colours', note: 'An evening of song, dance and a shared meal.' },
    { id: 'pitthi', name: 'Pitthi Dastoor', day: '6 Mar 2027', time: '10:00 AM', place: 'Rang Mahal Haveli Gardens', dress: 'Haldi yellow, simple cottons', note: 'Turmeric anointing with blessings, songs and dhol.' },
    { id: 'wedding', name: 'Baraat & Pheras', day: '6 Mar 2027', time: '7:30 PM', place: 'Rang Mahal Haveli Gardens', dress: 'Traditional, rich jewel tones', note: 'The baraat arrives, followed by Jaimala and the sacred pheras.' },
  ],
}
