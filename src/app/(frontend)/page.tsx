import Services from './components/Services'
import SpecialistSection from './components/SpecialistSection'
import ContactSection from './components/ContactSection'
import SectionHeader from './components/SectionHeader'

export default function HomePage() {
  return (
    /* overflow-x-hidden prevents the horizontal scrollbar 
       w-full ensures it spans the viewport correctly */
    <main className="relative bg-white dark:bg-black w-full overflow-x-hidden min-h-screen">
      <SectionHeader />
      <Services />
      <SpecialistSection />
      <ContactSection />
      {/* Future sections like Testimonials or Footer can be added here */}
    </main>
  )
}
