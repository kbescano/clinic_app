import Services from '../components/Services'
import SiteFooter from '../components/SiteFooter'

export default async function Page() {
  return (
    <>
      <div className="p-0 lg:p-8 mt-10">
        <Services />
      </div>
      <SiteFooter />
    </>
  )
}
