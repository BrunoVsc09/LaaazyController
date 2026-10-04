const two = (n: number) => String(n).padStart(2, '0')

export const formatClock = (d: Date) => `${two(d.getHours())}:${two(d.getMinutes())}`

export const displayUser = (name: string) => ({ name, initial: name.charAt(0).toUpperCase() })
