import { Box, Flex, Spinner, Text, VStack } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const LoadingSpinner = ({ message = "Loading..." }) => {
    return (
        <Flex minH="400px" w="100%" align="center" justify="center" direction="column">
            <VStack spacing={6}>
                <Box position="relative">
                    {/* Outer ring */}
                    <Spinner
                        thickness="4px"
                        speed="0.8s"
                        emptyColor="gray.200"
                        color="blue.500"
                        size="xl"
                        w="80px"
                        h="80px"
                    />
                    {/* Inner ring */}
                    <Spinner
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        thickness="3px"
                        speed="0.6s"
                        emptyColor="gray.100"
                        color="teal.400"
                        size="lg"
                        w="50px"
                        h="50px"
                    />
                </Box>
                <VStack spacing={2}>
                    <Text
                        fontSize="lg"
                        fontWeight="medium"
                        color="gray.600"
                        animation={`${pulse} 1.5s ease-in-out infinite`}
                    >
                        {message}
                    </Text>
                    <Text fontSize="sm" color="gray.400">
                        Please wait a moment
                    </Text>
                </VStack>
            </VStack>
        </Flex>
    );
};

export default LoadingSpinner;
