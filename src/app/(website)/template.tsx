/**
 * Re-mounts on every navigation, which replays the CSS fade-in on the wrapper. Opacity only: a
 * transform here would turn the wrapper into the containing block for the fixed buttons inside pages.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>
}
