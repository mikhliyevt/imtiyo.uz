export const base44 = {
  auth: {
    me: async () => null,
    login: async () => null,
    logout: async () => null,
    redirectToLogin: () => {},
  },
  entities: {},
  integrations: {
    Core: {
      UploadFile: async ({ file }) => ({
        file_url: file ? URL.createObjectURL(file) : '',
      }),
      CreateFileSignedUrl: async ({ file_uri }) => ({
        signed_url: file_uri || '',
      }),
    },
  },
  appLogs: {
    logUserInApp: async () => {},
  },
};

export default base44;