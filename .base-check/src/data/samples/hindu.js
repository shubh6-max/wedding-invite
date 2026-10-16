// FICTIONAL sample: all people, venues and dates are invented; dates are not muhurat-checked.
// Strict superset of src/data/sample.js; ritual wording should be reviewed by a family or priest.
export const hinduSample = {
  tradition: 'hindu',
  couple: { a: 'Kavya', b: 'Vihaan' },
  full: { a: 'Kavya Trivedi', b: 'Vihaan Bhatt' },
  // Host ordering varies by family and region; confirm with both families.
  hosts: 'Shri Harish Trivedi & Smt. Sunita Trivedi, with Shri Mahesh Bhatt & Smt. Rekha Bhatt',
  tagline: 'request the honour of your presence to bless the wedding of',
  // ISO with offset so the countdown is correct in every timezone (Pheras muhurat time).
  date: '2027-03-06T10:42:00+05:30',
  dateLabel: 'Saturday, 6 March 2027',
  timeLabel: '10:42 AM',
  venue: 'Gomti Heritage Lawns',
  city: 'Lucknow, Uttar Pradesh',
  mapUrl: 'https://maps.google.com/?q=Lucknow',
  rsvpBy: '5 February 2027',
  // Top-of-card Ganesh invocation (high-confidence Devanagari).
  invocation: {
    text: 'Shri Ganeshaya Namah',
    script: 'श्री गणेशाय नमः',
    meaning: 'Salutations to Shri Ganesha, who removes obstacles',
  },
  greeting: {
    text: 'Namaste',
    script: 'नमस्ते',
    meaning: 'I bow to you, with respect',
  },
  story: [
    { year: '2019', title: 'A shared bench', text: 'They met at a cousin’s housewarming and talked until the lamps were lit.' },
    { year: '2022', title: 'Blessings of elders', text: 'Both families met over a quiet lunch and gave their warm approval.' },
    { year: '2025', title: 'A promise made', text: 'With their parents’ blessings, they chose to walk together as one.' },
  ],
  // Exactly 4, chronological; Haldi and Sangeet are customs, Pheras/Vidaai are the sacred core.
  events: [
    { id: 'haldi', name: 'Haldi', day: '4 Mar 2027', time: '10:00 AM', place: 'Trivedi Residence', dress: 'Soft yellows', note: 'Turmeric is applied with blessings for purity and well-being; wear clothes you are happy to stain.' },
    { id: 'sangeet', name: 'Sangeet', day: '5 Mar 2027', time: '7:00 PM', place: 'Gomti Heritage Lawns', dress: 'Festive Indian', note: 'An evening of music and family songs, as both families come together.' },
    { id: 'wedding', name: 'Vivah (Pheras)', day: '6 Mar 2027', time: '10:42 AM', place: 'Gomti Heritage Lawns', dress: 'Traditional, red and gold welcome', note: 'The sacred ceremony before the fire, beginning at the auspicious muhurat; please be seated by 10:15 AM.' },
    { id: 'vidaai', name: 'Vidaai', day: '6 Mar 2027', time: '2:30 PM', place: 'Gomti Heritage Lawns', dress: 'Traditional', note: 'The bride’s farewell from her parental home, with blessings for the journey ahead.' },
  ],
}
