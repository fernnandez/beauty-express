import { Box, Button, Container } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { Navbar } from '../sections/Navbar'
import { Demo } from '../sections/Demo'
import { CTA } from '../sections/CTA'
import { Footer } from '../sections/Footer'

export function SystemPage() {
  return (
    <>
      <Navbar />
      <main>
        <Box bg="gray.0" pt={{ base: 24, sm: 32 }}>
          <Container size="lg">
            <Button
              component={Link}
              to="/"
              variant="subtle"
              color="brand"
              leftSection={<IconArrowLeft size={18} />}
              px={0}
            >
              Voltar para a página inicial
            </Button>
          </Container>
        </Box>
        <Demo />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
