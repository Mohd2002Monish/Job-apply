import * as React from "react";
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
    FormHelperText,
    useToast,
    IconButton,
    InputGroup,
    InputLeftElement,
    Flex,
    Select,
    Switch,
    Textarea,
    Tooltip,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
} from "@chakra-ui/react";
import {
    ChevronUpIcon,
    ChevronDownIcon,
    SearchIcon,
    EditIcon,
    DeleteIcon,
    EmailIcon,
    PhoneIcon,
} from "@chakra-ui/icons";
import { FaPaperPlane, FaWhatsapp } from "react-icons/fa";

import axios from "axios";

const JobsTable = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const [jobs, setJobs] = React.useState([]);
    const [sortConfig, setSortConfig] = React.useState({
        key: "createdAt",
        direction: "desc",
    });
    const [filterText, setFilterText] = React.useState("");
    const JOB_TITLE_OPTIONS = ["Backend", "Frontend", "Full-Stack", "MERN", "React.js", "Node.js"];
    const [newJob, setNewJob] = React.useState({
        job: "",
        email: "",
        description: "",
        number: "",
        recuiterName: "",
        city: "",
        includeInCron: true,
    });
    const { isOpen: isUpdateModalOpen, onOpen: onUpdateModalOpen, onClose: onUpdateModalClose } = useDisclosure();
    const { isOpen: isDescModalOpen, onOpen: onDescModalOpen, onClose: onDescModalClose } = useDisclosure();
    const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();
    const { isOpen: isSendMailAlertOpen, onOpen: onSendMailAlertOpen, onClose: onSendMailAlertClose } = useDisclosure();
    const [descriptionModalJob, setDescriptionModalJob] = React.useState(null);
    const [editForm, setEditForm] = React.useState(null);
    const [deleteJobId, setDeleteJobId] = React.useState(null);
    const [updateLoading, setUpdateLoading] = React.useState(false);
    const [deleteLoading, setDeleteLoading] = React.useState(false);
    const [sendMailLoading, setSendMailLoading] = React.useState(false);
    const [sendingSingleMailId, setSendingSingleMailId] = React.useState(null);
    const cancelRef = React.useRef();
    const toast = useToast();

    React.useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await axios.get(`${apiUrl}/jobs`);
            setJobs(response.data);
        } catch (error) {
            toast({
                title: "Error fetching jobs",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const requestSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const getSortedJobs = () => {
        const sortedJobs = [...jobs];
        sortedJobs.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
        return sortedJobs;
    };

    const getFilteredJobs = () => {
        return getSortedJobs().filter((job) =>
            Object.values(job).some((value) => String(value).toLowerCase().includes(filterText.toLowerCase()))
        );
    };

    const handleSend = async (id, name) => {
        setSendingSingleMailId(id);
        try {
            const response = await axios.get(`${apiUrl}/send-mail-single`, {
                params: { id },
            });
            toast({
                title: `Email sent successfully to ${name}`,
                description: "Your application email has been sent to the recruiter.",
                status: "success",
                duration: 4000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Failed to send email",
                description: error.response?.data?.error || error.message,
                status: "error",
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setSendingSingleMailId(null);
        }
    };

    const handleDeleteConfirm = async () => {
        setDeleteLoading(true);
        try {
            await axios.delete(`${apiUrl}/delete-job`, {
                params: { id: deleteJobId },
            });
            toast({
                title: "Job deleted successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            fetchJobs();
        } catch (error) {
            toast({
                title: "Error deleting job",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setDeleteLoading(false);
            onDeleteAlertClose();
            setDeleteJobId(null);
        }
    };

    const openDeleteAlert = (id) => {
        setDeleteJobId(id);
        onDeleteAlertOpen();
    };

    const openUpdateModal = (job) => {
        setEditForm({
            _id: job._id,
            job: job.job ?? "",
            email: job.email ?? "",
            description: job.description ?? "",
            number: job.number ?? "",
            recuiterName: job.recuiterName ?? "",
            city: job.city ?? "",
            includeInCron: job.includeInCron !== false,
        });
        onUpdateModalOpen();
    };

    const handleUpdateSubmit = async () => {
        if (!editForm || !editForm._id || !editForm.email?.trim() || !editForm.job?.trim()) {
            toast({
                title: "Job title and email are required",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        setUpdateLoading(true);
        try {
            const { data } = await axios.put(`${apiUrl}/jobs/${editForm._id}`, {
                job: editForm.job,
                email: editForm.email,
                description: editForm.description || undefined,
                number: editForm.number || undefined,
                recuiterName: editForm.recuiterName || undefined,
                city: editForm.city || undefined,
                includeInCron: editForm.includeInCron,
            });
            setJobs((prev) => prev.map((j) => (j._id === data._id ? { ...j, ...data } : j)));
            toast({
                title: "Job updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            onUpdateModalClose();
        } catch (error) {
            toast({
                title: "Update failed",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${apiUrl}/jobs`, newJob);
            setNewJob({
                job: "",
                email: "",
                description: "",
                number: "",
                recuiterName: "",
                city: "",
                includeInCron: true,
            });
            fetchJobs();
            toast({
                title: "Job created successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error creating job",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleStartCron = async () => {
        try {
            await axios.get(`${apiUrl}/start-cron`);
            toast({
                title: "Cron job started",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Failed to start cron job",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleSendMailAll = async () => {
        setSendMailLoading(true);
        try {
            const response = await axios.get(`${apiUrl}/send-mail-all`);
            toast({
                title: "Emails sent successfully",
                description: response.data.message,
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Failed to send emails",
                description: error.message,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setSendMailLoading(false);
            onSendMailAlertClose();
        }
    };

    const bgColor = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.100", "gray.700");
    const hoverBgColor = useColorModeValue("gray.50", "gray.700");
    const textColor = useColorModeValue("gray.600", "gray.300");

    return (
        <>
            <VStack spacing={8} align="stretch">
                <Box>
                    <HStack spacing={4} w="100%">
                        <Button colorScheme="green" onClick={handleStartCron} flex={1}>
                            Start Cron Job
                        </Button>
                        <Button colorScheme="blue" onClick={onSendMailAlertOpen} flex={1}>
                            Send Email to All
                        </Button>
                    </HStack>
                </Box>
                <Box
                    p={6}
                    borderWidth="1px"
                    borderRadius="md"
                    bg={bgColor}
                    shadow="0 1px 3px rgba(0,0,0,0.05)"
                    borderColor={borderColor}
                >
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Job Title</FormLabel>
                                <Select
                                    value={newJob.job}
                                    onChange={(e) =>
                                        setNewJob({
                                            ...newJob,
                                            job: e.target.value,
                                        })
                                    }
                                    placeholder="Select job title"
                                >
                                    {JOB_TITLE_OPTIONS.map((title) => (
                                        <option key={title} value={title}>
                                            {title}
                                        </option>
                                    ))}
                                </Select>
                                <HStack mt={2} spacing={2} flexWrap="wrap">
                                    {["Frontend", "Backend", "Full-Stack", "MERN"].map((title) => (
                                        <Button
                                            key={title}
                                            size="sm"
                                            variant={newJob.job === title ? "solid" : "outline"}
                                            colorScheme="teal"
                                            onClick={() =>
                                                setNewJob({
                                                    ...newJob,
                                                    job: title,
                                                })
                                            }
                                        >
                                            {title}
                                        </Button>
                                    ))}
                                </HStack>
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>Email</FormLabel>
                                <Input
                                    type="email"
                                    value={newJob.email}
                                    onChange={(e) =>
                                        setNewJob({
                                            ...newJob,
                                            email: e.target.value,
                                        })
                                    }
                                    placeholder="Enter email"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Recuiter Name</FormLabel>
                                <Input
                                    type="text"
                                    value={newJob.recuiterName}
                                    onChange={(e) =>
                                        setNewJob({
                                            ...newJob,
                                            recuiterName: e.target.value,
                                        })
                                    }
                                    placeholder="Enter Recuiter Name"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>City</FormLabel>
                                <Input
                                    type="text"
                                    value={newJob.city}
                                    onChange={(e) =>
                                        setNewJob({
                                            ...newJob,
                                            city: e.target.value,
                                        })
                                    }
                                    placeholder="Enter city"
                                />
                                <HStack mt={2} spacing={2}>
                                    {["Noida", "Gurugram", "Pune"].map((city) => (
                                        <Button
                                            key={city}
                                            size="sm"
                                            variant={newJob.city === city ? "solid" : "outline"}
                                            colorScheme="blue"
                                            onClick={() => setNewJob({ ...newJob, city })}
                                        >
                                            {city}
                                        </Button>
                                    ))}
                                </HStack>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Contact Number</FormLabel>
                                <Input
                                    type="tel"
                                    value={newJob.number}
                                    onChange={(e) =>
                                        setNewJob({
                                            ...newJob,
                                            number: e.target.value,
                                        })
                                    }
                                    placeholder="Paste contact number"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Description</FormLabel>
                                <Textarea
                                    value={newJob.description}
                                    onChange={(e) =>
                                        setNewJob({
                                            ...newJob,
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder="Enter job description"
                                    rows={3}
                                />
                            </FormControl>
                            <FormControl display="flex" alignItems="center" gap={3}>
                                <FormLabel htmlFor="include-in-cron" mb={0}>
                                    Include in cron
                                </FormLabel>
                                <Switch
                                    id="include-in-cron"
                                    isChecked={newJob.includeInCron}
                                    onChange={(e) =>
                                        setNewJob({
                                            ...newJob,
                                            includeInCron: e.target.checked,
                                        })
                                    }
                                    colorScheme="green"
                                />
                                <FormHelperText mb={0}>When on, this job is picked when cron runs.</FormHelperText>
                            </FormControl>
                            <Button type="submit" colorScheme="blue">
                                Create Job
                            </Button>
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
                                    borderColor={borderColor}
                                    _hover={{ borderColor: "gray.300" }}
                                />
                            </InputGroup>
                        </HStack>

                        <Box overflowX="auto" borderRadius="md">
                            <Table variant="simple" size="sm">
                                <Thead bg={hoverBgColor}>
                                    <Tr borderBottomWidth="1px" borderColor={borderColor}>
                                        <Th onClick={() => requestSort("job")} cursor="pointer">
                                            <HStack spacing={1}>
                                                <Text>Job Title</Text>
                                                {sortConfig.key === "job" && (
                                                    <IconButton
                                                        icon={
                                                            sortConfig.direction === "asc" ? (
                                                                <ChevronUpIcon />
                                                            ) : (
                                                                <ChevronDownIcon />
                                                            )
                                                        }
                                                        size="xs"
                                                        variant="ghost"
                                                        aria-label={`Sort by job ${
                                                            sortConfig.direction === "asc" ? "descending" : "ascending"
                                                        }`}
                                                    />
                                                )}
                                            </HStack>
                                        </Th>
                                        <Th onClick={() => requestSort("email")} cursor="pointer">
                                            <HStack spacing={1}>
                                                <Text>Email</Text>
                                                {sortConfig.key === "email" && (
                                                    <IconButton
                                                        icon={
                                                            sortConfig.direction === "asc" ? (
                                                                <ChevronUpIcon />
                                                            ) : (
                                                                <ChevronDownIcon />
                                                            )
                                                        }
                                                        size="xs"
                                                        variant="ghost"
                                                        aria-label={`Sort by email ${
                                                            sortConfig.direction === "asc" ? "descending" : "ascending"
                                                        }`}
                                                    />
                                                )}
                                            </HStack>
                                        </Th>
                                        <Th>Recuiter Name</Th>
                                        <Th>City</Th>
                                        <Th>Contact Number</Th>
                                        <Th onClick={() => requestSort("createdAt")} cursor="pointer">
                                            <HStack spacing={1}>
                                                <Text>Created At</Text>
                                                {sortConfig.key === "createdAt" && (
                                                    <IconButton
                                                        icon={
                                                            sortConfig.direction === "asc" ? (
                                                                <ChevronUpIcon />
                                                            ) : (
                                                                <ChevronDownIcon />
                                                            )
                                                        }
                                                        size="xs"
                                                        variant="ghost"
                                                        aria-label={`Sort by creation date ${
                                                            sortConfig.direction === "asc" ? "descending" : "ascending"
                                                        }`}
                                                    />
                                                )}
                                            </HStack>
                                        </Th>
                                        <Th>Action Button</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {getFilteredJobs().map((job) => (
                                        <Tr
                                            key={job._id}
                                            borderBottomWidth="1px"
                                            borderColor={borderColor}
                                            _hover={{ bg: hoverBgColor }}
                                        >
                                            <Td>
                                                <Tooltip label="Click to view description" placement="top" hasArrow>
                                                    <Text
                                                        as="span"
                                                        cursor="pointer"
                                                        borderBottomWidth="1px"
                                                        borderStyle="dotted"
                                                        color={textColor}
                                                        fontWeight="500"
                                                        onClick={() => {
                                                            setDescriptionModalJob(job);
                                                            onDescModalOpen();
                                                        }}
                                                        _hover={{ color: "blue.500" }}
                                                    >
                                                        {job.job}
                                                    </Text>
                                                </Tooltip>
                                            </Td>
                                            <Td color={textColor} fontSize="sm">
                                                {job.email}
                                            </Td>
                                            <Td color={textColor}>{job.recuiterName || "—"}</Td>
                                            <Td color={textColor}>{job.city || "—"}</Td>
                                            <Td color={textColor} fontSize="sm">
                                                {job.number ? (
                                                    <HStack spacing={3}>
                                                        <HStack
                                                            as="a"
                                                            href={`tel:${job.number}`}
                                                            spacing={2}
                                                            color="blue.500"
                                                            _hover={{
                                                                color: "blue.700",
                                                            }}
                                                            cursor="pointer"
                                                            fontWeight="500"
                                                        >
                                                            <PhoneIcon fontSize="sm" />
                                                            <Text>{job.number}</Text>
                                                        </HStack>
                                                        <Tooltip label="Chat on WhatsApp" hasArrow>
                                                            <IconButton
                                                                as="a"
                                                                href={`https://wa.me/${job.number
                                                                    .replace(/\D/g, "")
                                                                    .replace(/^0+/, "")}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                icon={<FaWhatsapp />}
                                                                size="sm"
                                                                colorScheme="green"
                                                                variant="ghost"
                                                                aria-label="WhatsApp"
                                                                color="green.500"
                                                                _hover={{ bg: "green.100", color: "green.600" }}
                                                            />
                                                        </Tooltip>
                                                    </HStack>
                                                ) : (
                                                    "—"
                                                )}
                                            </Td>
                                            <Td color={textColor} fontSize="sm">
                                                {new Date(job.createdAt).toLocaleDateString()}
                                            </Td>
                                            <Td>
                                                <Flex gap="6px" justifyContent="center">
                                                    <Tooltip label="Send Email" hasArrow>
                                                        <IconButton
                                                            icon={<FaPaperPlane />}
                                                            size="sm"
                                                            colorScheme="green"
                                                            variant="ghost"
                                                            onClick={() => handleSend(job._id, job.recuiterName)}
                                                            isLoading={sendingSingleMailId === job._id}
                                                            _hover={{ bg: "green.100" }}
                                                        />
                                                    </Tooltip>
                                                    <Tooltip label="Edit" hasArrow>
                                                        <IconButton
                                                            icon={<EditIcon />}
                                                            size="sm"
                                                            colorScheme="blue"
                                                            variant="ghost"
                                                            onClick={() => openUpdateModal(job)}
                                                            _hover={{ bg: "blue.100" }}
                                                        />
                                                    </Tooltip>

                                                    <Tooltip label="Delete" hasArrow>
                                                        <IconButton
                                                            icon={<DeleteIcon />}
                                                            size="sm"
                                                            colorScheme="red"
                                                            variant="ghost"
                                                            onClick={() => openDeleteAlert(job._id)}
                                                            _hover={{ bg: "red.100" }}
                                                        />
                                                    </Tooltip>
                                                </Flex>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </Box>
                    </VStack>
                </Box>

                <Modal isOpen={isDescModalOpen} onClose={onDescModalClose} size="md">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>{descriptionModalJob?.job ?? "Description"}</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Text whiteSpace="pre-wrap">{descriptionModalJob?.description || "No description."}</Text>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                colorScheme="blue"
                                variant="solid"
                                onClick={() => {
                                    onDescModalClose();
                                    if (descriptionModalJob) openUpdateModal(descriptionModalJob);
                                }}
                                isDisabled={!descriptionModalJob}
                            >
                                Update
                            </Button>
                            <Button
                                colorScheme="red"
                                variant="solid"
                                onClick={() => {
                                    if (descriptionModalJob?._id) {
                                        openDeleteAlert(descriptionModalJob._id);
                                        onDescModalClose();
                                    }
                                }}
                                isDisabled={!descriptionModalJob?._id}
                            >
                                Delete
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                <Modal isOpen={isUpdateModalOpen} onClose={onUpdateModalClose} size="lg" scrollBehavior="inside">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Update job</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            {editForm && (
                                <Stack spacing={4}>
                                    <FormControl isRequired>
                                        <FormLabel>Job Title</FormLabel>
                                        <Select
                                            value={editForm.job}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    job: e.target.value,
                                                })
                                            }
                                            placeholder="Select job title"
                                        >
                                            {JOB_TITLE_OPTIONS.map((title) => (
                                                <option key={title} value={title}>
                                                    {title}
                                                </option>
                                            ))}
                                        </Select>
                                        <HStack mt={2} spacing={2} flexWrap="wrap">
                                            {["Frontend", "Backend", "Full-Stack", "MERN"].map((title) => (
                                                <Button
                                                    key={title}
                                                    size="sm"
                                                    variant={editForm.job === title ? "solid" : "outline"}
                                                    colorScheme="teal"
                                                    onClick={() =>
                                                        setEditForm({
                                                            ...editForm,
                                                            job: title,
                                                        })
                                                    }
                                                >
                                                    {title}
                                                </Button>
                                            ))}
                                        </HStack>
                                    </FormControl>
                                    <FormControl isRequired>
                                        <FormLabel>Email</FormLabel>
                                        <Input
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    email: e.target.value,
                                                })
                                            }
                                            placeholder="Enter email"
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>Recuiter Name</FormLabel>
                                        <Input
                                            value={editForm.recuiterName}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    recuiterName: e.target.value,
                                                })
                                            }
                                            placeholder="Enter Recuiter Name"
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>City</FormLabel>
                                        <Input
                                            value={editForm.city}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    city: e.target.value,
                                                })
                                            }
                                            placeholder="Enter city"
                                        />
                                        <HStack mt={2} spacing={2}>
                                            {["Noida", "Gurugram", "Pune"].map((city) => (
                                                <Button
                                                    key={city}
                                                    size="sm"
                                                    variant={editForm.city === city ? "solid" : "outline"}
                                                    colorScheme="blue"
                                                    onClick={() =>
                                                        setEditForm({
                                                            ...editForm,
                                                            city,
                                                        })
                                                    }
                                                >
                                                    {city}
                                                </Button>
                                            ))}
                                        </HStack>
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>Contact Number</FormLabel>
                                        <Input
                                            type="tel"
                                            value={editForm.number}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    number: e.target.value,
                                                })
                                            }
                                            placeholder="Paste contact number"
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>Description</FormLabel>
                                        <Textarea
                                            value={editForm.description}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    description: e.target.value,
                                                })
                                            }
                                            placeholder="Full job description"
                                            rows={4}
                                        />
                                    </FormControl>
                                    <FormControl display="flex" alignItems="center" gap={3}>
                                        <FormLabel htmlFor="edit-include-in-cron" mb={0}>
                                            Include in cron
                                        </FormLabel>
                                        <Switch
                                            id="edit-include-in-cron"
                                            isChecked={editForm.includeInCron}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    includeInCron: e.target.checked,
                                                })
                                            }
                                            colorScheme="green"
                                        />
                                        <FormHelperText mb={0}>
                                            When on, this job is picked when cron runs.
                                        </FormHelperText>
                                    </FormControl>
                                </Stack>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={onUpdateModalClose}>
                                Cancel
                            </Button>
                            <Button colorScheme="blue" onClick={handleUpdateSubmit} isLoading={updateLoading}>
                                Update
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {/* Delete Confirmation Alert */}
                <AlertDialog isOpen={isDeleteAlertOpen} leastDestructiveRef={cancelRef} onClose={onDeleteAlertClose}>
                    <AlertDialogOverlay>
                        <AlertDialogContent>
                            <AlertDialogHeader fontSize="lg" fontWeight="bold">
                                Delete Job
                            </AlertDialogHeader>

                            <AlertDialogBody>
                                Are you sure you want to delete this job? This action cannot be undone.
                            </AlertDialogBody>

                            <AlertDialogFooter>
                                <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                                    Cancel
                                </Button>
                                <Button
                                    colorScheme="red"
                                    onClick={handleDeleteConfirm}
                                    ml={3}
                                    isLoading={deleteLoading}
                                >
                                    Delete
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialogOverlay>
                </AlertDialog>

                {/* Send Email to All Confirmation Alert */}
                <AlertDialog
                    isOpen={isSendMailAlertOpen}
                    leastDestructiveRef={cancelRef}
                    onClose={onSendMailAlertClose}
                >
                    <AlertDialogOverlay>
                        <AlertDialogContent>
                            <AlertDialogHeader fontSize="lg" fontWeight="bold">
                                Send Emails to All
                            </AlertDialogHeader>

                            <AlertDialogBody>
                                Are you sure you want to send emails to all {jobs.length} jobs? This will send an email
                                to each recruiter.
                            </AlertDialogBody>

                            <AlertDialogFooter>
                                <Button ref={cancelRef} onClick={onSendMailAlertClose}>
                                    Cancel
                                </Button>
                                <Button
                                    colorScheme="blue"
                                    onClick={handleSendMailAll}
                                    ml={3}
                                    isLoading={sendMailLoading}
                                >
                                    Send
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialogOverlay>
                </AlertDialog>
            </VStack>
        </>
    );
};

export default JobsTable;
