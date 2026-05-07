import { useEffect, useRef, useState } from 'react'
import './App.css'

const INVITE_MEDIA_BASE = `${import.meta.env.BASE_URL}invite-media/`
const BACKGROUND_IMAGE = `${INVITE_MEDIA_BASE}couple-background.jpg`
const BRIDE_IMAGE = `${INVITE_MEDIA_BASE}bride-komal.jpg`
const GROOM_IMAGE = `${INVITE_MEDIA_BASE}groom-prem.svg`
const BRIDE_IMAGE_FALLBACK = `${INVITE_MEDIA_BASE}bride-komal.svg`
const GROOM_IMAGE_FALLBACK = `${INVITE_MEDIA_BASE}groom-prem.svg`
const AUTO_SCROLL_DELAY = 1600

const invitation = {
  chapter: 'A New Chapter Begins',
  saveDate: 'Save the Date: July 4, 2026',
  names: 'Sakshi & Chinmay',
  quoteLineOne: 'Sabne Poocha... "Kab?"',
  quoteLineTwo: 'Humne Bola... "Ab!"',
  countdownLabel: 'Counting down to our big day',
  sideQuestion: 'Tum Kis Side Ho?',
  groomLabel: 'Team Groom',
  brideLabel: 'Team Bride',
  footerNote: "Think Fast... Baraat Won't Wait!",
  targetDate: '2026-07-04T12:30:00+05:30',
}

const teamMessages = {
  bride: {
    icon: '\u2655',
    title: 'TEAM BRIDE SECURED',
    subtitle: 'NAKHARA FULL POWER!',
  },
  groom: {
    icon: '\u2654',
    title: 'Team Groom secured',
    subtitle: 'Jalwa Full Power',
  },
}

const celebrationEvents = [
  {
    title: 'Grahayadnya',
    locationLabel: 'Suraj Apartment',
    locationUrl: 'https://maps.app.goo.gl/uNTCwLmAnWydQWCv6',
    date: '1 July 2026',
    time: '8 AM',
  },
  {
    title: 'Mehendi',
    locationLabel: 'Suraj Apartment',
    locationUrl: 'https://maps.app.goo.gl/uNTCwLmAnWydQWCv6',
    date: '2 July 2026',
    time: '8 PM',
  },
  {
    title: 'Simant Pujan',
    locationLabel: 'Rugved Mangal Karyalay',
    locationUrl: 'https://maps.app.goo.gl/8fXUMmhi63h383UD7',
    date: '3 July 2026',
    time: '8 PM',
  },
  {
    title: 'Wedding',
    locationLabel: 'Rugved Mangal Karyalay',
    locationUrl: 'https://maps.app.goo.gl/8fXUMmhi63h383UD7',
    date: '4 July 2026',
    time: '12:30 PM',
  },
]

const confettiPieces = Array.from({ length: 200 }, (_, index) => ({
  id: index,
  left: `${((index * 37) % 100) + (((index * 13) % 7) - 3) * 0.35}%`,
  start: `${-6 - (index % 18) * 5}%`,
  delay: `${(index % 16) * 0.03}s`,
  duration: `${1.9 + (index % 7) * 0.16}s`,
  size: `${7 + (index % 5) * 2.5}px`,
  drift: `${-58 + ((index * 19) % 116)}px`,
  rotation: `${160 + index * 23}deg`,
  color: ['#f8d26a', '#f4a6c9', '#8ee3ef', '#ffffff', '#c6a1ff', '#ffd59e'][
    index % 6
  ],
}))

function getTimeLeft(targetDate) {
  const difference = new Date(targetDate).getTime() - Date.now()

  if (difference <= 0) {
    return {
      days: '00',
      hours: '00',
      minutes: '00',
      seconds: '00',
    }
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24))
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((difference / (1000 * 60)) % 60)
  const seconds = Math.floor((difference / 1000) % 60)

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  }
}

function CountdownStat({ value, label }) {
  return (
    <div className="countdown-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z"
        fill="currentColor"
      />
      <circle cx="12" cy="11" r="2.4" fill="#fffaf4" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M7 3.5a1 1 0 0 1 1 1V6h8V4.5a1 1 0 1 1 2 0V6h.25A2.75 2.75 0 0 1 21 8.75v9.5A2.75 2.75 0 0 1 18.25 21h-12.5A2.75 2.75 0 0 1 3 18.25v-9.5A2.75 2.75 0 0 1 5.75 6H6V4.5a1 1 0 0 1 1-1Z"
        fill="currentColor"
      />
      <path d="M3 10h18" stroke="#fffaf4" strokeWidth="1.8" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <path
        d="M12 7.4v5.3l3.7 2.2"
        fill="none"
        stroke="#fffaf4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  )
}

function PlannerCard({ event, index }) {
  const directionClass =
    index % 2 === 0 ? 'planner-card--from-left' : 'planner-card--from-right'

  return (
    <article className={`planner-card ${directionClass}`} data-planner-card>
      <div className="planner-card__header">
        <span className="planner-card__index">Karyakram {index + 1}</span>
        <span className="planner-card__chip">Shubh Sohala</span>
      </div>

      <h3 className="planner-card__title">{event.title}</h3>

      <div className="planner-card__details">
        <div className="planner-detail">
          <span className="planner-detail__icon">
            <MapPinIcon />
          </span>
          <div className="planner-detail__content">
            <span className="planner-detail__label">Location</span>
            <a
              className="planner-detail__value planner-detail__value--link"
              href={event.locationUrl}
              target="_blank"
              rel="noreferrer"
            >
              {event.locationLabel}
            </a>
          </div>
        </div>

        <div className="planner-detail">
          <span className="planner-detail__icon">
            <CalendarIcon />
          </span>
          <div className="planner-detail__content">
            <span className="planner-detail__label">Date</span>
            <span className="planner-detail__value">{event.date}</span>
          </div>
        </div>

        <div className="planner-detail">
          <span className="planner-detail__icon">
            <ClockIcon />
          </span>
          <div className="planner-detail__content">
            <span className="planner-detail__label">Time</span>
            <span className="planner-detail__value">{event.time}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function App() {
  const [timeLeft, setTimeLeft] = useState(() =>
    getTimeLeft(invitation.targetDate),
  )
  const [isOpened, setIsOpened] = useState(false)
  const [selectedSide, setSelectedSide] = useState(null)
  const [confettiBurst, setConfettiBurst] = useState(0)
  const inviteHomeRef = useRef(null)
  const welcomeSectionRef = useRef(null)
  const plannerSectionRef = useRef(null)
  const scrollTimeoutRef = useRef(null)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimeLeft(getTimeLeft(invitation.targetDate))
    }, 1000)

    return () => {
      window.clearInterval(intervalId)

      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const scrollRoot = inviteHomeRef.current
    const plannerSection = plannerSectionRef.current

    if (!scrollRoot || !plannerSection) {
      return undefined
    }

    const cards = Array.from(plannerSection.querySelectorAll('[data-planner-card]'))

    if (!cards.length) {
      return undefined
    }

    if (!('IntersectionObserver' in window)) {
      cards.forEach((card) => card.classList.add('is-visible'))
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return
          }

          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      {
        root: scrollRoot,
        threshold: 0.18,
        rootMargin: '0px 0px -12% 0px',
      },
    )

    cards.forEach((card) => observer.observe(card))

    return () => {
      observer.disconnect()
    }
  }, [])

  const handleTeamSelect = (team) => {
    setSelectedSide(team)
    setConfettiBurst((current) => current + 1)

    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      welcomeSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, AUTO_SCROLL_DELAY)
  }

  const handleBack = () => {
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current)
    }

    setIsOpened(false)
    setSelectedSide(null)
    setConfettiBurst(0)
    inviteHomeRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <main className="app-page">
      <section
        className={`app-shell ${isOpened ? 'is-open' : ''}`}
        aria-label="Wedding invitation mobile app"
      >
        <div className="app-shell__device">
          {isOpened ? (
            <div className="app-bar">
              <button
                type="button"
                className="app-bar__button"
                onClick={handleBack}
                aria-label="Go back"
              >
                <span className="app-bar__back" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          <article
            ref={inviteHomeRef}
            className="invite-home"
            style={{ '--invite-image': `url("${BACKGROUND_IMAGE}")` }}
          >
            <div className="invite-home__stack">
              <section className="invite-home__hero">
                <div className="invite-home__overlay" aria-hidden="true" />
                {confettiBurst ? (
                  <div key={confettiBurst} className="confetti-layer" aria-hidden="true">
                    {confettiPieces.map((piece) => (
                      <span
                        key={piece.id}
                        className="confetti-piece"
                        style={{
                          '--confetti-left': piece.left,
                          '--confetti-start': piece.start,
                          '--confetti-delay': piece.delay,
                          '--confetti-duration': piece.duration,
                          '--confetti-size': piece.size,
                          '--confetti-drift': piece.drift,
                          '--confetti-rotation': piece.rotation,
                          '--confetti-color': piece.color,
                        }}
                      />
                    ))}
                  </div>
                ) : null}

                <div className="invite-home__content">
                  {selectedSide ? (
                    <div
                      className={`team-toast team-toast--${selectedSide}`}
                      role="status"
                      aria-live="polite"
                    >
                      <p className="team-toast__title">
                        <span className="team-toast__icon" aria-hidden="true">
                          {teamMessages[selectedSide].icon}
                        </span>
                        <span>{teamMessages[selectedSide].title}</span>
                      </p>
                      <p className="team-toast__subtitle">
                        {teamMessages[selectedSide].subtitle}
                      </p>
                    </div>
                  ) : null}

                  <p className="invite-home__eyebrow">{invitation.chapter}</p>
                  <p className="invite-home__save-date">{invitation.saveDate}</p>

                  <h1 className="invite-home__names">{invitation.names}</h1>

                  <div className="invite-home__rule" aria-hidden="true" />

                  <p className="invite-home__quote">{invitation.quoteLineOne}</p>
                  <p className="invite-home__quote invite-home__quote--secondary">
                    {invitation.quoteLineTwo}
                  </p>

                  <p className="invite-home__countdown-label">
                    {invitation.countdownLabel}
                  </p>

                  <div className="countdown-grid">
                    <CountdownStat value={timeLeft.days} label="Days" />
                    <CountdownStat value={timeLeft.hours} label="Hours" />
                    <CountdownStat value={timeLeft.minutes} label="Minutes" />
                    <CountdownStat value={timeLeft.seconds} label="Seconds" />
                  </div>

                  <p className="invite-home__question">{invitation.sideQuestion}</p>

                  <div className="choice-row">
                    <button
                      type="button"
                      className={`choice-button ${
                        selectedSide === 'groom' ? 'is-selected' : ''
                      }`}
                      onClick={() => handleTeamSelect('groom')}
                    >
                      {invitation.groomLabel}
                    </button>
                    <button
                      type="button"
                      className={`choice-button ${
                        selectedSide === 'bride' ? 'is-selected' : ''
                      }`}
                      onClick={() => handleTeamSelect('bride')}
                    >
                      {invitation.brideLabel}
                    </button>
                  </div>

                  <p className="invite-home__footer">{invitation.footerNote}</p>
                </div>
              </section>

              <section
                ref={welcomeSectionRef}
                className="welcome-section"
                aria-label="Meet the couple"
              >
                <div className="welcome-section__inner">
                  <p className="welcome-section__subhead">To Our Sundowner Wedding</p>
                  <h2 className="welcome-section__title">Welcome</h2>

                  <div className="welcome-section__copy">
                    <p>After all the "kab?" and "ab?"...</p>
                    <p>it&apos;s finally happening.</p>
                    <p>And we&apos;d love for you to be part of it.</p>
                  </div>

                  <p className="welcome-section__label">Meet the Couple</p>

                  <div className="profile-card">
                    <img
                      className="profile-card__image"
                      src={BRIDE_IMAGE}
                      alt="Sakshi portrait"
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = BRIDE_IMAGE_FALLBACK
                      }}
                    />
                    <p className="profile-card__role">The Bride</p>
                    <h3 className="profile-card__name">Sakshi</h3>
                    <div className="profile-card__rule" aria-hidden="true" />
                    <p className="profile-card__text">
                      Her grace lights every moment, her warmth makes every smile
                      brighter, and her love is the heart of this celebration.
                    </p>
                  </div>

                  <div className="profile-card profile-card--groom">
                    <img
                      className="profile-card__image"
                      src={GROOM_IMAGE}
                      alt="Chinmay portrait"
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = GROOM_IMAGE_FALLBACK
                      }}
                    />
                    <p className="profile-card__role">The Groom</p>
                    <h3 className="profile-card__name">Chinmay</h3>
                    <div className="profile-card__rule" aria-hidden="true" />
                    <p className="profile-card__text">
                      His laughter lifts every room, his strength steadies every
                      promise, and his love makes this forever feel effortless.
                    </p>
                  </div>
                </div>
              </section>

              <section
                ref={plannerSectionRef}
                className="planner-section"
                aria-label="Lagna karyakram"
              >
                <div className="planner-section__inner">
                  <p className="planner-section__eyebrow">Lagnasohala</p>
                  <h2 className="planner-section__title">Shubh Karyakram</h2>
                  <p className="planner-section__intro">
                    From Grahayadnya and Mehendi to Simant Pujan and the big
                    day, here is our family&apos;s celebration schedule for the
                    special days ahead.
                  </p>

                  <div className="planner-timeline">
                    {celebrationEvents.map((event, index) => (
                      <PlannerCard key={event.title} event={event} index={index} />
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </article>

          <div className="seal-intro" aria-hidden={isOpened}>
            <div className="seal-door seal-door--left">
              <span className="seal-door__stripe" />
              <p className="seal-door__word">Forever</p>
            </div>

            <div className="seal-door seal-door--right">
              <span className="seal-door__stripe" />
              <p className="seal-door__word">Begins</p>
            </div>

            <div className="seal-intro__center">
              <p className="seal-intro__eyebrow">Wedding Invitation</p>
              <button
                type="button"
                className="seal-button"
                onClick={() => setIsOpened(true)}
                aria-expanded={isOpened}
                aria-label="Open invitation"
              >
                <span className="seal-button__core">
                  <span className="seal-button__monogram">SC</span>
                </span>
              </button>
              <p className="seal-intro__hint">Tap the wax seal to enter</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
