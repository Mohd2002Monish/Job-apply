import * as React from "react";
import { ChakraProvider, Box, Button, HStack, Container, Heading } from "@chakra-ui/react";
import theme from "./theme";
import LoadingSpinner from "./components/LoadingSpinner";

// Lazy load the table components
const JobsTable = React.lazy(() => import("./components/JobsTable"));
const ContactsTable = React.lazy(() => import("./components/ContactsTable"));

function App() {
    const [activeTab, setActiveTab] = React.useState("jobs");

    return (
        <ChakraProvider theme={theme}>
            <Container maxW="container.xl" py={8}>
                <HStack spacing={4} mb={8} justifyContent="center">
                    <Button
                        colorScheme={activeTab === "jobs" ? "blue" : "gray"}
                        onClick={() => setActiveTab("jobs")}
                        size="lg"
                        px={8}
                    >
                        Jobs Table
                    </Button>
                    <Button
                        colorScheme={activeTab === "contacts" ? "blue" : "gray"}
                        onClick={() => setActiveTab("contacts")}
                        size="lg"
                        px={8}
                    >
                        Contacts Table
                    </Button>
                </HStack>

                <React.Suspense
                    fallback={
                        <LoadingSpinner message={activeTab === "jobs" ? "Loading Jobs..." : "Loading Contacts..."} />
                    }
                >
                    {activeTab === "jobs" && <JobsTable />}
                    {activeTab === "contacts" && <ContactsTable />}
                </React.Suspense>
            </Container>
        </ChakraProvider>
    );
}

export default App;
