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
  useToast,
  IconButton,
  InputGroup,
  InputLeftElement,
  Flex,
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
  DeleteIcon,
  EditIcon,
  PhoneIcon,
} from "@chakra-ui/icons";
import axios from "axios";

const ContactsTable = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [contacts, setContacts] = React.useState([]);
  const [sortConfig, setSortConfig] = React.useState({
    key: "createdAt",
    direction: "desc",
  });
  const [filterText, setFilterText] = React.useState("");
  const [newContact, setNewContact] = React.useState({
    name: "",
    contact: "",
    notes: "",
  });
  const {
    isOpen: isUpdateModalOpen,
    onOpen: onUpdateModalOpen,
    onClose: onUpdateModalClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteAlertOpen,
    onOpen: onDeleteAlertOpen,
    onClose: onDeleteAlertClose,
  } = useDisclosure();
  const [editForm, setEditForm] = React.useState(null);
  const [deleteContactId, setDeleteContactId] =
    React.useState(null);
  const [updateLoading, setUpdateLoading] =
    React.useState(false);
  const [deleteLoading, setDeleteLoading] =
    React.useState(false);
  const cancelRef = React.useRef();
  const toast = useToast();

  React.useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/contacts`
      );
      setContacts(response.data);
    } catch (error) {
      toast({
        title: "Error fetching contacts",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedContacts = () => {
    const sortedContacts = [...contacts];
    sortedContacts.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sortedContacts;
  };

  const getFilteredContacts = () => {
    return getSortedContacts().filter((contact) =>
      Object.values(contact).some((value) =>
        String(value)
          .toLowerCase()
          .includes(filterText.toLowerCase())
      )
    );
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await axios.delete(
        `${apiUrl}/contacts/${deleteContactId}`
      );
      toast({
        title: "Contact deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchContacts();
    } catch (error) {
      toast({
        title: "Error deleting contact",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeleteLoading(false);
      onDeleteAlertClose();
      setDeleteContactId(null);
    }
  };

  const openDeleteAlert = (id) => {
    setDeleteContactId(id);
    onDeleteAlertOpen();
  };

  const openUpdateModal = (contact) => {
    setEditForm({
      _id: contact._id,
      name: contact.name ?? "",
      contact: contact.contact ?? "",
      notes: contact.notes ?? "",
    });
    onUpdateModalOpen();
  };

  const handleUpdateSubmit = async () => {
    if (
      !editForm ||
      !editForm._id ||
      !editForm.name?.trim() ||
      !editForm.contact?.trim()
    ) {
      toast({
        title: "Name and contact number are required",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setUpdateLoading(true);
    try {
      const { data } = await axios.put(
        `${apiUrl}/contacts/${editForm._id}`,
        {
          name: editForm.name,
          contact: editForm.contact,
          notes: editForm.notes || undefined,
        }
      );
      setContacts((prev) =>
        prev.map((c) =>
          c._id === data._id ? { ...c, ...data } : c
        )
      );
      toast({
        title: "Contact updated successfully",
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
      await axios.post(`${apiUrl}/contacts`, newContact);
      setNewContact({ name: "", contact: "", notes: "" });
      fetchContacts();
      toast({
        title: "Contact created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error creating contact",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue(
    "gray.100",
    "gray.700"
  );
  const hoverBgColor = useColorModeValue(
    "gray.50",
    "gray.700"
  );
  const textColor = useColorModeValue(
    "gray.600",
    "gray.300"
  );

  return (
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
            <FormLabel>Contact Name</FormLabel>
            <Input
              type="text"
              placeholder="Enter contact name"
              value={newContact.name}
              onChange={(e) =>
                setNewContact({
                  ...newContact,
                  name: e.target.value,
                })
              }
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Phone Number</FormLabel>
            <Input
              type="tel"
              placeholder="Enter phone number"
              value={newContact.contact}
              onChange={(e) =>
                setNewContact({
                  ...newContact,
                  contact: e.target.value,
                })
              }
            />
          </FormControl>

          <FormControl>
            <FormLabel>Notes</FormLabel>
            <Textarea
              placeholder="Add any additional notes (optional)"
              value={newContact.notes}
              onChange={(e) =>
                setNewContact({
                  ...newContact,
                  notes: e.target.value,
                })
              }
            />
          </FormControl>

          <Button type="submit" colorScheme="teal" w="100%">
            Add Contact
          </Button>
        </Stack>
      </form>

      <Box mt={8}>
        <HStack spacing={4} mb={6}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              type="text"
              placeholder="Search contacts..."
              value={filterText}
              onChange={(e) =>
                setFilterText(e.target.value)
              }
              borderColor={borderColor}
              _hover={{ borderColor: "gray.300" }}
            />
          </InputGroup>
        </HStack>

        <Box overflowX="auto" borderRadius="md">
          <Table variant="simple" size="sm">
            <Thead bg={hoverBgColor}>
              <Tr
                borderBottomWidth="1px"
                borderColor={borderColor}
              >
                <Th
                  cursor="pointer"
                  onClick={() => requestSort("name")}
                >
                  <HStack spacing={2}>
                    <Text>Name</Text>
                    {sortConfig.key === "name" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUpIcon />
                      ) : (
                        <ChevronDownIcon />
                      ))}
                  </HStack>
                </Th>
                <Th
                  cursor="pointer"
                  onClick={() => requestSort("contact")}
                >
                  <HStack spacing={2}>
                    <Text>Phone Number</Text>
                    {sortConfig.key === "contact" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUpIcon />
                      ) : (
                        <ChevronDownIcon />
                      ))}
                  </HStack>
                </Th>
                <Th
                  cursor="pointer"
                  onClick={() => requestSort("notes")}
                >
                  <HStack spacing={2}>
                    <Text>Notes</Text>
                    {sortConfig.key === "notes" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUpIcon />
                      ) : (
                        <ChevronDownIcon />
                      ))}
                  </HStack>
                </Th>
                <Th textAlign="center">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {getFilteredContacts().map((contact) => (
                <Tr
                  key={contact._id}
                  borderBottomWidth="1px"
                  borderColor={borderColor}
                  _hover={{ bg: hoverBgColor }}
                >
                  <Td color={textColor}>{contact.name}</Td>
                  <Td>
                    <HStack
                      as="a"
                      href={`tel:${contact.contact}`}
                      spacing={2}
                      color="blue.500"
                      _hover={{
                        color: "blue.700",
                      }}
                      cursor="pointer"
                      fontWeight="500"
                    >
                      <PhoneIcon fontSize="sm" />
                      <Text>{contact.contact}</Text>
                    </HStack>
                  </Td>
                  <Td color={textColor} fontSize="sm">
                    {contact.notes || "-"}
                  </Td>
                  <Td>
                    <HStack
                      spacing={1}
                      justifyContent="center"
                    >
                      <Tooltip label="Edit" hasArrow>
                        <IconButton
                          icon={<EditIcon />}
                          size="sm"
                          colorScheme="blue"
                          variant="ghost"
                          onClick={() =>
                            openUpdateModal(contact)
                          }
                          _hover={{ bg: "blue.100" }}
                        />
                      </Tooltip>
                      <Tooltip label="Delete" hasArrow>
                        <IconButton
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() =>
                            openDeleteAlert(contact._id)
                          }
                          _hover={{ bg: "red.100" }}
                        />
                      </Tooltip>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          {getFilteredContacts().length === 0 && (
            <Text
              textAlign="center"
              mt={4}
              color="gray.500"
            >
              No contacts found
            </Text>
          )}
        </Box>
      </Box>

      {/* Update Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={onUpdateModalClose}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent bg={bgColor}>
          <ModalHeader>Edit Contact</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Contact Name</FormLabel>
                <Input
                  value={editForm?.name || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      name: e.target.value,
                    })
                  }
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Phone Number</FormLabel>
                <Input
                  value={editForm?.contact || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      contact: e.target.value,
                    })
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={editForm?.notes || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      notes: e.target.value,
                    })
                  }
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2}>
              <Button
                variant="ghost"
                onClick={onUpdateModalClose}
              >
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                isLoading={updateLoading}
                onClick={handleUpdateSubmit}
              >
                Save
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader
              fontSize="lg"
              fontWeight="bold"
            >
              Delete Contact
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this contact?
              This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={onDeleteAlertClose}
              >
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
    </Box>
  );
};

export default ContactsTable;
