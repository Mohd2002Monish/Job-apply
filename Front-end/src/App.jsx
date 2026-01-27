import * as React from 'react';
import { ChakraProvider, Box, Button, HStack, Container, Heading } from '@chakra-ui/react';
import theme from './theme';
import JobsTable from './components/JobsTable';
import ContactsTable from './components/ContactsTable';

function App() {
  const [activeTab, setActiveTab] = React.useState('jobs');

  return (
    <ChakraProvider theme={theme}>
      <Container maxW="container.xl" py={8}>
        <HStack spacing={4} mb={8} justifyContent="center">
          <Button
            colorScheme={activeTab === 'jobs' ? 'blue' : 'gray'}
            onClick={() => setActiveTab('jobs')}
            size="lg"
            px={8}
          >
            Jobs Table
          </Button>
          <Button
            colorScheme={activeTab === 'contacts' ? 'blue' : 'gray'}
            onClick={() => setActiveTab('contacts')}
            size="lg"
            px={8}
          >
            Contacts Table
          </Button>
        </HStack>

        {activeTab === 'jobs' && <JobsTable />}
        {activeTab === 'contacts' && <ContactsTable />}
      </Container>
    </ChakraProvider>
  );
}

export default App;
