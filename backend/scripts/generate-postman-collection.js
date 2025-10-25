/**
 * Generate Postman Collection from OpenAPI Specification
 *
 * This script converts the OpenAPI YAML spec to a Postman v2.1 collection.
 * Usage: node scripts/generate-postman-collection.js
 *
 * Output: vibe-calendar-postman-collection.json
 */

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

// Paths
const OPENAPI_PATH = path.join(__dirname, '../src/docs/openapi.yaml');
const OUTPUT_PATH = path.join(__dirname, '../vibe-calendar-postman-collection.json');

/**
 * Convert OpenAPI spec to Postman collection
 */
function generatePostmanCollection() {
  console.log('🔄 Reading OpenAPI specification...');

  // Read OpenAPI spec
  const openapiYaml = fs.readFileSync(OPENAPI_PATH, 'utf8');
  const openapi = YAML.parse(openapiYaml);

  console.log(`✅ Loaded OpenAPI ${openapi.info.version}: ${openapi.info.title}`);

  // Create Postman collection base
  const collection = {
    info: {
      name: openapi.info.title,
      description: openapi.info.description,
      version: openapi.info.version,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    auth: {
      type: "bearer",
      bearer: [
        {
          key: "token",
          value: "{{jwt_token}}",
          type: "string"
        }
      ]
    },
    variable: [
      {
        key: "baseUrl",
        value: "http://localhost:3001/api/v1",
        type: "string"
      },
      {
        key: "jwt_token",
        value: "",
        type: "string"
      }
    ],
    item: []
  };

  // Group endpoints by tag
  const tagGroups = {};

  if (!openapi.paths) {
    console.error('❌ No paths found in OpenAPI spec');
    return;
  }

  // Process each path
  Object.entries(openapi.paths).forEach(([pathUrl, pathItem]) => {
    Object.entries(pathItem).forEach(([method, operation]) => {
      // Skip if not an HTTP method
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
        return;
      }

      const tag = operation.tags?.[0] || 'Other';

      if (!tagGroups[tag]) {
        tagGroups[tag] = {
          name: tag,
          item: []
        };
      }

      // Create Postman request
      const request = createPostmanRequest(pathUrl, method, operation, openapi);
      tagGroups[tag].item.push(request);
    });
  });

  // Add groups to collection
  collection.item = Object.values(tagGroups);

  // Write to file
  console.log('💾 Writing Postman collection...');
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(collection, null, 2));

  console.log(`✅ Postman collection generated: ${OUTPUT_PATH}`);
  console.log(`📊 Stats:`);
  console.log(`   - ${Object.keys(tagGroups).length} endpoint groups`);
  console.log(`   - ${collection.item.reduce((sum, group) => sum + group.item.length, 0)} total requests`);
}

/**
 * Create a Postman request from OpenAPI operation
 */
function createPostmanRequest(pathUrl, method, operation, openapi) {
  const request = {
    name: operation.summary || `${method.toUpperCase()} ${pathUrl}`,
    request: {
      method: method.toUpperCase(),
      header: [],
      url: {
        raw: `{{baseUrl}}${pathUrl}`,
        host: ["{{baseUrl}}"],
        path: pathUrl.split('/').filter(p => p)
      },
      description: operation.description || ''
    },
    response: []
  };

  // Add query parameters
  if (operation.parameters) {
    const queryParams = operation.parameters.filter(p => p.in === 'query');
    if (queryParams.length > 0) {
      request.request.url.query = queryParams.map(param => ({
        key: param.name,
        value: param.example || param.schema?.example || '',
        description: param.description || '',
        disabled: !param.required
      }));
    }

    // Add path variables
    const pathParams = operation.parameters.filter(p => p.in === 'path');
    if (pathParams.length > 0) {
      request.request.url.variable = pathParams.map(param => ({
        key: param.name,
        value: param.example || param.schema?.example || '1',
        description: param.description || ''
      }));
    }
  }

  // Add request body
  if (operation.requestBody) {
    const content = operation.requestBody.content?.['application/json'];
    if (content) {
      request.request.header.push({
        key: 'Content-Type',
        value: 'application/json'
      });

      // Use first example if available
      const examples = content.examples;
      if (examples) {
        const firstExample = Object.values(examples)[0];
        request.request.body = {
          mode: 'raw',
          raw: JSON.stringify(firstExample.value, null, 2),
          options: {
            raw: {
              language: 'json'
            }
          }
        };
      } else if (content.schema) {
        // Generate example from schema
        const exampleBody = generateExampleFromSchema(content.schema, openapi);
        request.request.body = {
          mode: 'raw',
          raw: JSON.stringify(exampleBody, null, 2),
          options: {
            raw: {
              language: 'json'
            }
          }
        };
      }
    }
  }

  // Add example responses
  if (operation.responses) {
    Object.entries(operation.responses).forEach(([statusCode, response]) => {
      const content = response.content?.['application/json'];
      if (content?.examples) {
        Object.entries(content.examples).forEach(([exampleName, example]) => {
          request.response.push({
            name: `${statusCode} - ${example.summary || exampleName}`,
            originalRequest: request.request,
            status: getStatusText(statusCode),
            code: parseInt(statusCode),
            header: [
              {
                key: 'Content-Type',
                value: 'application/json'
              }
            ],
            body: JSON.stringify(example.value, null, 2)
          });
        });
      }
    });
  }

  // Override auth for public endpoints
  if (!operation.security || operation.security.length === 0) {
    request.request.auth = { type: 'noauth' };
  }

  return request;
}

/**
 * Generate example from JSON schema
 */
function generateExampleFromSchema(schema, openapi) {
  // Resolve $ref if present
  if (schema.$ref) {
    const refPath = schema.$ref.replace('#/components/schemas/', '');
    schema = openapi.components.schemas[refPath];
  }

  if (!schema) return {};

  const example = {};

  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, prop]) => {
      if (prop.example !== undefined) {
        example[key] = prop.example;
      } else if (prop.type === 'string') {
        example[key] = prop.format === 'email' ? 'user@example.com' : 'string';
      } else if (prop.type === 'integer') {
        example[key] = 1;
      } else if (prop.type === 'boolean') {
        example[key] = true;
      } else if (prop.type === 'array') {
        example[key] = [];
      } else if (prop.type === 'object') {
        example[key] = {};
      }
    });
  }

  return example;
}

/**
 * Get HTTP status text from code
 */
function getStatusText(code) {
  const statusTexts = {
    '200': 'OK',
    '201': 'Created',
    '204': 'No Content',
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '403': 'Forbidden',
    '404': 'Not Found',
    '409': 'Conflict',
    '429': 'Too Many Requests',
    '500': 'Internal Server Error'
  };
  return statusTexts[code] || 'Unknown';
}

// Run the generator
try {
  generatePostmanCollection();
} catch (error) {
  console.error('❌ Error generating Postman collection:', error.message);
  console.error(error.stack);
  process.exit(1);
}
