import { Navbar } from '../sections/Navbar'
import { Hero } from '../sections/Hero'
import { FromNotebook } from '../sections/FromNotebook'
import { Results } from '../sections/Results'
import { Features } from '../sections/Features'
import { MobileApp } from '../sections/MobileApp'
import { Roadmap } from '../sections/Roadmap'
import { ClientProof } from '../sections/ClientProof'
import { CTA } from '../sections/CTA'
import { Footer } from '../sections/Footer'

export function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FromNotebook />
        <Results />
        <Features />
        <MobileApp />
        <Roadmap />
        <ClientProof />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
