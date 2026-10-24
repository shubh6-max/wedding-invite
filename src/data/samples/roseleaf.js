import { sageEnvelopeSample } from './sageenvelope.js'

// Roseleaf's own content: Sage Envelope's (the same couple, Komal & Prem, and the same PLACEHOLDER families, dates,
// venue and events; see that file), plus what only Roseleaf shows: a line about each of them, their story in four
// moments and a note on the back of each event card. EVERYTHING ADDED HERE IS A PLACEHOLDER too; replace it with the
// couple's own words before sending the link.
const NOTES = {
  mehendi: 'Henna artists are with us all afternoon; come early if you would like your hands done.',
  sangeet: 'Bring your dancing shoes: both families have been rehearsing for weeks.',
  wedding: 'Please be seated half an hour before the ceremony. Lunch follows the pheras.',
  reception: 'Dinner is served from 8:00 PM. Valet parking at the main gate.',
  cocktail: 'A relaxed evening with friends, music and the last toast of the week.',
}

export const roseleafSample = {
  ...sageEnvelopeSample,
  about: {
    a: 'Komal is the one who says yes first: to a new city, a new recipe, a new idea.',
    b: 'Prem is the one with the plan, the backup plan, and a list to keep track of both.',
    together: 'She brings the spark and he keeps the map, and somewhere between the two they found home.',
  },
  story: [
    { title: 'The first hello', text: 'One message on an ordinary evening, answered a little too quickly. We have not stopped talking since.' },
    { title: 'Becoming us', text: 'Long drives, late chai and a hundred small days that quietly added up to everything.' },
    { title: 'Miles apart', text: 'Different cities taught us patience, trust and how to say goodnight across time zones.' },
    { title: 'Our forever', text: 'Through every high and low we kept choosing each other, and now we begin our forever.' },
  ],
  events: sageEnvelopeSample.events.map((e) => ({ ...e, note: NOTES[e.id] })),
}
