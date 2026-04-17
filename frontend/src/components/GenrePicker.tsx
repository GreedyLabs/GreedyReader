import { cn } from '@/lib/utils'
import { GENRES, GENRE_GROUPS, GENRE_COLOR } from '@/lib/genres'
import type { GenreId } from '@/lib/genres'

interface Props {
  value: GenreId | undefined
  onChange: (id: GenreId | undefined) => void
}

export default function GenrePicker({ value, onChange }: Props) {
  return (
    <div className="space-y-2.5">
      {GENRE_GROUPS.map((group) => {
        const items = GENRES.filter((g) => g.group === group)
        return (
          <div key={group}>
            <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              {group}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {items.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onChange(value === g.id ? undefined : g.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                    value === g.id ? 'text-white' : 'bg-gray-100 text-gray-500',
                  )}
                  style={value === g.id ? { backgroundColor: GENRE_COLOR[g.id] } : {}}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
