import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'gray.50',
      },
    },
  },
  components: {
    Table: {
      variants: {
        simple: {
          th: {
            borderBottom: '1px',
            borderColor: 'gray.200',
            padding: '1rem',
            textTransform: 'none',
            letterSpacing: 'normal',
          },
          td: {
            borderBottom: '1px',
            borderColor: 'gray.200',
            padding: '1rem',
          },
        },
      },
    },
  },
});

export default theme;