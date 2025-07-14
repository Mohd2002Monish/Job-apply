import * as React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Input,
  Stack,
  Text,
  useColorModeValue,
  Container,
  Button,
  HStack,
  VStack,
  FormControl,
  FormLabel,
  Textarea,
  useToast,
  IconButton,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon, SearchIcon } from '@chakra-ui/icons';
import axios from 'axios';

const JobsTable = () => {
  const [jobs, setJobs] = React.useState([]);
  const [sortConfig, setSortConfig] = React.useState({ key: 'createdAt', direction: 'desc' });
  const [filterText, setFilterText] = React.useState('');
  const [newJob, setNewJob] = React.useState({ job: '', email: '', description: '' });
  const toast = useToast();

  React.useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get("https://job-apply-l52x.onrender.com/jobs");
      setJobs(response.data);
    } catch (error) {
      toast({
        title: 'Error fetching jobs',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedJobs = () => {
    const sortedJobs = [...jobs];
    sortedJobs.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortedJobs;
  };

  const getFilteredJobs = () => {
    return getSortedJobs().filter(job =>
      Object.values(job).some(value =>
        String(value).toLowerCase().includes(filterText.toLowerCase())
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("https://job-apply-l52x.onrender.com/jobs", newJob);
      setNewJob({ job: '', email: '', description: '' });
      fetchJobs();
      toast({
        title: 'Job created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error creating job',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const bgColor = useColorModeValue('white', 'gray.800');

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box p={6} borderWidth="1px" borderRadius="lg" bg={bgColor} shadow="sm">
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Job Title</FormLabel>
                <Input
                  value={newJob.job}
                  onChange={(e) => setNewJob({ ...newJob, job: e.target.value })}
                  placeholder="Enter job title"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={newJob.email}
                  onChange={(e) => setNewJob({ ...newJob, email: e.target.value })}
                  placeholder="Enter email"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="Enter job description"
                />
              </FormControl>
              <Button type="submit" colorScheme="blue">Create Job</Button>
            </Stack>
          </form>
        </Box>

        <Box p={6} borderWidth="1px" borderRadius="lg" bg={bgColor} shadow="sm">
          <VStack spacing={4} align="stretch">
            <HStack spacing={4}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search jobs..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </InputGroup>
            </HStack>

            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th onClick={() => requestSort('job')} cursor="pointer">
                      <HStack spacing={1}>
                        <Text>Job Title</Text>
                        {sortConfig.key === 'job' && (
                          <IconButton
                            icon={sortConfig.direction === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />}
                            size="xs"
                            variant="ghost"
                            aria-label={`Sort by job ${sortConfig.direction === 'asc' ? 'descending' : 'ascending'}`}
                          />
                        )}
                      </HStack>
                    </Th>
                    <Th onClick={() => requestSort('email')} cursor="pointer">
                      <HStack spacing={1}>
                        <Text>Email</Text>
                        {sortConfig.key === 'email' && (
                          <IconButton
                            icon={sortConfig.direction === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />}
                            size="xs"
                            variant="ghost"
                            aria-label={`Sort by email ${sortConfig.direction === 'asc' ? 'descending' : 'ascending'}`}
                          />
                        )}
                      </HStack>
                    </Th>
                    <Th>Description</Th>
                    <Th onClick={() => requestSort('createdAt')} cursor="pointer">
                      <HStack spacing={1}>
                        <Text>Created At</Text>
                        {sortConfig.key === 'createdAt' && (
                          <IconButton
                            icon={sortConfig.direction === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />}
                            size="xs"
                            variant="ghost"
                            aria-label={`Sort by creation date ${sortConfig.direction === 'asc' ? 'descending' : 'ascending'}`}
                          />
                        )}
                      </HStack>
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {getFilteredJobs().map((job) => (
                    <Tr key={job._id}>
                      <Td>{job.job}</Td>
                      <Td>{job.email}</Td>
                      <Td>
                        <Text noOfLines={2}>{job.description}</Text>
                      </Td>
                      <Td>{new Date(job.createdAt).toLocaleDateString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default JobsTable;