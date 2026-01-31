const SwaggerParser = require('@apidevtools/swagger-parser');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const { faker } = require('@faker-js/faker');
const commander = require('commander');

// CLI 支持
const program = new commander.Command();
program
  .option('-i, --input <file>', 'Input Swagger JSON/YAML file', './apis/petstore.json')
  .option('-o, --output <dir>', 'Output directory', './dist')
  .parse(process.argv);
const options = program.opts();

/**
 * 增强示例生成：用faker生成更真实数据，支持$ref、enum、oneOf等
 */
function generateExample(schema, defs = {}) {
  if (!schema) return null;
  if (schema.example !== undefined) return schema.example;

  // 处理$ref
  if (schema.$ref) {
    const refKey = schema.$ref.replace('#/components/schemas/', '');
    return generateExample(defs[refKey], defs);
  }

  // 处理oneOf/anyOf (随机选一个)
  if (schema.oneOf || schema.anyOf) {
    const options = schema.oneOf || schema.anyOf;
    return generateExample(options[Math.floor(Math.random() * options.length)], defs);
  }

  if (schema.type === 'object' && schema.properties) {
    const obj = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
      obj[key] = generateExample(prop, defs);
    }
    return obj;
  }

  if (schema.type === 'array' && schema.items) {
    return [generateExample(schema.items, defs), generateExample(schema.items, defs)]; // 2个元素
  }

  // enum: 随机选一个
  if (schema.enum) {
    return schema.enum[Math.floor(Math.random() * schema.enum.length)];
  }

  switch (schema.type) {
    case 'string':
      return schema.format === 'email' ? faker.internet.email() :
             schema.format === 'date' ? faker.date.past().toISOString() :
             schema.format === 'uuid' ? faker.datatype.uuid() : faker.lorem.word();
    case 'integer': return faker.datatype.number({ min: schema.minimum || 0, max: schema.maximum || 100 });
    case 'number': return faker.datatype.float({ min: schema.minimum || 0, max: schema.maximum || 100 });
    case 'boolean': return faker.datatype.boolean();
    default: return null;
  }
}

/**
 * AI 补说明 - 生成人性化描述
 * 模拟AI：更智能规则。实际增值版可集成OpenAI API (e.g., await openai.complete('Humanize: ' + summary))
 */
function generateHumanDescription(method, route, info) {
  if (info.summary) return info.summary;
  const actions = {
    get: ['获取', '查询', '列出'],
    post: ['创建', '添加', '提交'],
    put: ['更新', '修改', '替换'],
    delete: ['删除', '移除', '注销']
  };
  const action = actions[method.toLowerCase()]?.[Math.floor(Math.random() * actions[method.toLowerCase()].length)] || '执行';
  const resource = route.split('/').pop().replace(/{[^}]+}/g, '指定项');
  return `${action}${resource}${method === 'get' && route.endsWith('s') ? '列表' : ''}。${faker.lorem.sentence(5)}`; // 加随机句模拟深度
}

/**
 * 调用示例 - curl / JS
 */
function generateCurlExample(method, route, bodyExample, params = []) {
  let curl = `curl -X ${method.toUpperCase()} "http://your-api-host${route}`;
  if (params.length > 0) curl += '?' + params.map(p => `${p.name}=${encodeURIComponent(generateExample(p.schema) || 'value')}`).join('&');
  curl += '"';
  if (bodyExample) curl += ` -H "Content-Type: application/json" -d '${JSON.stringify(bodyExample)}'`;
  return curl;
}

function generateJsExample(method, route, bodyExample, params = []) {
  let url = `'http://your-api-host${route}`;
  if (params.length > 0) url += '?' + params.map(p => `${p.name}=\${encodeURIComponent('${generateExample(p.schema) || 'value'}')}`).join('&');
  url += `'`;
  let jsCode = `fetch(${url}, {\n  method: '${method.toUpperCase()}',\n`;
  if (bodyExample) jsCode += `  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify(${JSON.stringify(bodyExample, null, 2)})\n`;
  jsCode += `})\n.then(res => res.json())\n.then(data => console.log(data));`;
  return jsCode;
}

/**
 * 自动挑错 - 增强报告
 */
function checkApiIssues(api) {
  const issues = [];
  const ajv = new Ajv({ allErrors: true });

  // ... (原有校验逻辑，添加更多规则)
  for (const [route, methods] of Object.entries(api.paths)) {
    for (const [method, info] of Object.entries(methods)) {
      if (!info.summary) issues.push(`[${route} ${method}] 缺失 summary`);
      if (info.parameters) {
        info.parameters.forEach(p => {
          if (!p.description) issues.push(`[${route} ${method}] 参数 ${p.name} 缺失描述`);
          if (p.schema && !ajv.validateSchema(p.schema)) issues.push(`[${route} ${method}] 参数 ${p.name} schema 无效: ${ajv.errorsText()}`);
        });
      }
      // 新增：检查响应schema
      for (const [status, res] of Object.entries(info.responses || {})) {
        const schema = res.content?.['application/json']?.schema;
        if (schema && !ajv.validateSchema(schema)) issues.push(`[${route} ${method}] 响应 ${status} schema 无效`);
      }
    }
  }
  return issues;
}

/**
 * 生成文档 - HTML/MD，支持模板（增值钩子）
 */
async function generateDocs(api, outputDir, template = 'default') {
  const defs = api.components?.schemas || {}; // 支持$ref

  // HTML (用Bootstrap现代化)
  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${api.info.title}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  </head><body class="container my-5">`;
  html += `<h1 class="mb-4">${api.info.title}</h1><h3>版本: ${api.info.version}</h3>`;

  for (const [route, methods] of Object.entries(api.paths)) {
    html += `<h2 class="mt-5">路径: ${route}</h2>`;
    for (const [method, info] of Object.entries(methods)) {
      html += `<h3 class="mt-4">${method.toUpperCase()}</h3><p>${generateHumanDescription(method, route, info)}</p>`;

      // 参数表
      const queryParams = info.parameters?.filter(p => p.in === 'query') || [];
      if (info.parameters?.length > 0) {
        html += `<h4>参数</h4><table class="table table-bordered"><thead><tr><th>名称</th><th>位置</th><th>类型</th><th>必填</th><th>描述</th></tr></thead><tbody>`;
        info.parameters.forEach(p => {
          html += `<tr><td>${p.name}</td><td>${p.in}</td><td>${p.schema?.type || '-'}</td><td>${p.required ? '是' : '否'}</td><td>${p.description || ''}</td></tr>`;
        });
        html += `</tbody></table>`;
      }

      // Body & Response 示例（新增响应示例）
      let bodyExample = null;
      if (info.requestBody?.content?.['application/json']?.schema) {
        bodyExample = generateExample(info.requestBody.content['application/json'].schema, defs);
        html += `<h4>请求 Body 示例</h4><pre class="bg-light p-3">${JSON.stringify(bodyExample, null, 2)}</pre>`;
      }
      const successRes = info.responses?.['200'] || info.responses?.['201'];
      if (successRes?.content?.['application/json']?.schema) {
        const resExample = generateExample(successRes.content['application/json'].schema, defs);
        html += `<h4>响应示例 (200)</h4><pre class="bg-light p-3">${JSON.stringify(resExample, null, 2)}</pre>`;
      }

      // 示例
      html += `<h4>curl 示例</h4><pre class="bg-light p-3">${generateCurlExample(method, route, bodyExample, queryParams)}</pre>`;
      html += `<h4>JS 示例</h4><pre class="bg-light p-3">${generateJsExample(method, route, bodyExample, queryParams)}</pre>`;
    }
  }
  html += `</body></html>`;

  // 保存HTML
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'index.html'), html);

  // MD类似（省略重复代码，类似原有generateMarkdown，但加示例增强）

  // 增值钩子：模板库（if template !== 'default'，加载自定义模板）
  // 批量导出：未来加循环处理多文件
  // 团队协作：生成分享链接 (e.g., upload to S3, return URL)
}

/**
 * Demo 展示 - 生成可运行服务器（用express模拟API）
 */
function generateDemo(api, outputDir) {
  let demoCode = `const express = require('express');\nconst app = express();\napp.use(express.json());\n`;
  for (const [route, methods] of Object.entries(api.paths)) {
    for (const [method, info] of Object.entries(methods)) {
      demoCode += `app.${method}('${route}', (req, res) => {\n  // 模拟响应\n  res.json({ message: '${info.summary || 'Success'}' });\n});\n`;
    }
  }
  demoCode += `app.listen(3000, () => console.log('Demo API running on http://localhost:3000'));\n`;
  fs.writeFileSync(path.join(outputDir, 'demo-server.js'), demoCode);
  console.log('Run: node dist/demo-server.js, then test with curl/JS examples');
}

async function run() {
  try {
    const api = await SwaggerParser.parse(options.input);
    const issues = checkApiIssues(api);
    console.log('Issues:', issues);

    await generateDocs(api, options.output);
    generateDemo(api, options.output);

    // 增值版钩子示例
    console.log('增值版提示: 添加 --template custom 以使用付费模板库');
  } catch (err) {
    console.error(err);
  }
}

run();