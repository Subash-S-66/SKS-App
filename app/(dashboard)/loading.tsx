export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-blue-600" />
        <p>Loading...</p>
      </div>
    </div>
  )
}
