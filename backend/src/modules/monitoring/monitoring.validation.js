// const { z } = require('zod');

// const HTTP_METHODS = [
//   'GET',
//   'POST',
//   'PUT',
//   'PATCH',
//   'DELETE',
//   'HEAD',
//   'OPTIONS',
// ];

// const checkEndpointSchema = z.object({
//   body: z.object({
//     endpointId: z.string().min(1, 'Endpoint ID is required.'),

//     userId: z.string().min(1, 'User ID is required.'),
//     url: z
//       .string({
//         required_error: 'URL is required.',
//       })
//       .url('Please provide a valid URL.'),

//     method: z
//       .enum(HTTP_METHODS)
//       .default('GET'),

//     expectedStatus: z
//       .number({
//         invalid_type_error: 'Expected status must be a number.',
//       })
//       .int()
//       .min(100)
//       .max(599)
//       .default(200),

//     timeout: z
//       .number({
//         invalid_type_error: 'Timeout must be a number.',
//       })
//       .int()
//       .min(100)
//       .max(60000)
//       .default(10000),
//   }),
// });

// module.exports = {
//   checkEndpointSchema,
// };


const { z } = require('zod');

const checkEndpointSchema = z.object({
  params: z.object({
    endpointId: z
      .string({
        required_error: 'Endpoint ID is required.',
      })
      .trim()
      .min(1, 'Endpoint ID is required.'),
  }),
});

module.exports = {
  checkEndpointSchema,
};