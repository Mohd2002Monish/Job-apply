import * as React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme';
import JobsTable from './components/JobsTable';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <JobsTable />
    </ChakraProvider>
  );
}

export default App;
