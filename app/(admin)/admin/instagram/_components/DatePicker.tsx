'use client'

import { useState, useEffect, useRef } from 'react'
import { DayPicker } from 'react-day-picker'
import { fr } from 'react-day-picker/locale'
import { format, addMinutes, setHours, setMinutes } from 'date-fns'
import 'react-day-picker/style.css'
import '../_styles/datepicker-dark.css'
import { SPINLY_BRAND } from '../_styles/brand'

interface Props {
  value: Date | null
  onChange: (date: Date | null) => void
}

const QUICK_PRESETS: { label: string; getDate: () => Date | null }[] = [
  { label: 'Maintenant', getDate: () => null },
  { label: 'Dans 1h', getDate: () => addMinutes(new Date(), 60) },
  {
    label: 'Demain 09:00',
    getDate: () => {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      return setMinutes(setHours(d, 9), 0)
    }
  },
  {
    label: 'Demain 14:00',
    getDate: () => {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      return setMinutes(setHours(d, 14), 0)
    }
  }
]

export default function DatePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value || undefined)
  const [hour, setHour] = useState(value ? value.getHours() : 14)
  const [minute, setMinute] = useState(value ? value.getMinutes() : 0)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Sync internal state when caller resets value externally.
  useEffect(() => {
    if (value) {
      setSelectedDate(value)
      setHour(value.getHours())
      setMinute(value.getMinutes())
    } else {
      setSelectedDate(undefined)
    }
  }, [value])

  function handleConfirm() {
    if (!selectedDate) {
      onChange(null)
    } else {
      onChange(setMinutes(setHours(selectedDate, hour), minute))
    }
    setOpen(false)
  }

  function handleClear() {
    setSelectedDate(undefined)
    onChange(null)
    setOpen(false)
  }

  return (
    <div ref={popoverRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: value ? 'rgba(96, 165, 250, 0.1)' : SPINLY_BRAND.bg.surface,
          border: `1px solid ${value ? 'rgba(96, 165, 250, 0.3)' : SPINLY_BRAND.border.default}`,
          color: SPINLY_BRAND.text.primary,
          padding: '12px 14px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8
        }}
      >
        <span>
          {value
            ? `📅 ${format(value, "EEEE d MMMM 'à' HH:mm", { locale: fr })}`
            : '🚀 Publier maintenant'}
        </span>
        <span style={{ fontSize: 11, color: SPINLY_BRAND.text.secondary }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div
          style={{
            marginTop: 8,
            background: 'rgba(20, 20, 20, 0.98)',
            border: `1px solid ${SPINLY_BRAND.border.hover}`,
            borderRadius: 12,
            padding: 16
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  const d = preset.getDate()
                  if (d) {
                    setSelectedDate(d)
                    setHour(d.getHours())
                    setMinute(d.getMinutes())
                    onChange(d)
                    setOpen(false)
                  } else {
                    handleClear()
                  }
                }}
                style={{
                  background: SPINLY_BRAND.bg.surface,
                  border: `1px solid ${SPINLY_BRAND.border.default}`,
                  color: SPINLY_BRAND.text.primary,
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="spinly-rdp-wrapper">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={fr}
              disabled={{ before: new Date() }}
              weekStartsOn={1}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 12,
              padding: 12,
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: 8
            }}
          >
            <span style={{ fontSize: 12, color: SPINLY_BRAND.text.secondary }}>Heure :</span>
            <select
              value={hour}
              onChange={(e) => setHour(parseInt(e.target.value, 10))}
              style={{
                background: '#1a1a1a',
                color: SPINLY_BRAND.text.primary,
                border: `1px solid ${SPINLY_BRAND.border.default}`,
                padding: '6px 8px',
                borderRadius: 6,
                fontSize: 13
              }}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {String(i).padStart(2, '0')}
                </option>
              ))}
            </select>
            <span style={{ color: SPINLY_BRAND.text.secondary }}>:</span>
            <select
              value={minute}
              onChange={(e) => setMinute(parseInt(e.target.value, 10))}
              style={{
                background: '#1a1a1a',
                color: SPINLY_BRAND.text.primary,
                border: `1px solid ${SPINLY_BRAND.border.default}`,
                padding: '6px 8px',
                borderRadius: 6,
                fontSize: 13
              }}
            >
              {[0, 15, 30, 45].map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, '0')}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 11, color: SPINLY_BRAND.text.tertiary }}>
              (heure locale du navigateur)
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedDate}
              style={{
                flex: 1,
                background: SPINLY_BRAND.gradientWarm,
                border: 'none',
                color: SPINLY_BRAND.text.primary,
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: selectedDate ? 'pointer' : 'not-allowed',
                opacity: selectedDate ? 1 : 0.4
              }}
            >
              Confirmer la date
            </button>
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: SPINLY_BRAND.bg.surface,
                border: `1px solid ${SPINLY_BRAND.border.default}`,
                color: SPINLY_BRAND.text.primary,
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Effacer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
