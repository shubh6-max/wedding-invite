// Sage Envelope's own content, laid over the contemporary sample (its registry row's `sample`, see data/presets.js).
// The couple is real (Komal & Prem). EVERYTHING ELSE IS A PLACEHOLDER: the family names, dates, times, venue and
// address below are invented. Replace them with the real details before sending the link. Section order and
// wording follow the reference reel; the event `day` / `time` formats ('11 Feb 2027', '3:30 PM') are the ones
// studio/compose.js reads, and the wedding event must fall on `date`.
const DRESS = 'Embracing the charm of Gujarati heritage Bandhani, Patola, Leheriya or Kutchi Mirrorwork' // placeholder

export const sageEnvelopeSample = {
  couple: { a: 'Komal', b: 'Prem' }, // a = bride, b = groom
  full: { a: 'Komal', b: 'Prem' },
  date: '2027-02-12T13:00:00+05:30', // placeholder
  dateLabel: 'Friday, 12 February 2027',
  timeLabel: '1:00 PM',
  venue: 'Saffron Court Gardens', // placeholder
  city: 'Udaipur, Rajasthan', // placeholder
  address: 'Saffron Court Gardens, Lake Palace Road, Udaipur, Rajasthan 313001', // placeholder; the map and directions use it
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Saffron%20Court%20Gardens%2C%20Udaipur',

  // The hero's formal invitation, top to bottom. All family names are placeholders.
  invocation: { text: 'Shri Chintamani Parshvanathaya Namah', script: null, meaning: '' },
  // No "With the blessings Of" block or hosts line: no `blessings`, and `hosts` is '' so the base sample's doesn't show.
  hosts: '',
  inviteLine: 'Cordially invite you to attend the\nWedding of their son', // \n: the line breaks there, as in the original
  // Real, not placeholders: each family line sits under that name.
  groomLine: 'Grand Son of Late Smt. Pravinaben Shamlalji Siyakiya\n&\nSon of Smt. Nirmala Pramodji Siyakiya (Oswal)',
  brideLine: 'Grand Daughter of Late Smt. Otibai Shantilalji Nanesha\n&\nDaughter of Smt. Lata Bhanwarlalji Nanesha (Oswal)',
  dateRange: '11th to 14th February 2027',

  events: [
    { id: 'mehendi', name: 'Mehendi', subtitle: 'A playful morning of mehendi and cultural festivities', day: '11 Feb 2027', time: '3:30 PM', place: 'Saffron Court Gardens', dress: DRESS },
    { id: 'sangeet', name: 'Sangeet', subtitle: 'A playful night of sangeet and cultural festivities', day: '11 Feb 2027', time: '7:30 PM', place: 'Saffron Court Gardens', dress: DRESS },
    { id: 'wedding', name: 'Wedding', subtitle: 'Two families, one sacred fire and a lifetime of promises', day: '12 Feb 2027', time: '1:00 PM', place: 'Saffron Court Gardens', dress: DRESS },
    { id: 'reception', name: 'Reception', subtitle: 'An evening of dinner, dancing and celebration', day: '13 Feb 2027', time: '7:30 PM', place: 'Saffron Court Gardens', dress: DRESS },
    { id: 'cocktail', name: 'Cocktail', subtitle: 'A playful night with friends and cultural festivities', day: '14 Feb 2027', time: '9:00 PM', place: 'Saffron Court Gardens', dress: DRESS },
  ],

  hashtag: '#PremKomalForever', // placeholder
  closing: { title: 'Awaiting Your Noble Presence', text: 'Because meeting two souls requires twice the fun and you!' },
  families: [
    { title: "Groom's Family", names: ['Mr. Rajesh Sharma', 'Mrs. Sunita Sharma'] }, // placeholder
    { title: "Bride's Family", names: ['Shri Anil Verma', 'Smt. Meena Verma'] }, // placeholder
  ],
}
