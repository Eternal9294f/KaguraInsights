import { KaguraMcpServer, McpRequest, McpResponse } from './server';

export class KaguraMcpClient {
  private server: KaguraMcpServer;

  constructor(serverInstance?: KaguraMcpServer) {
    this.server = serverInstance || new KaguraMcpServer();
  }

  public async listTools(): Promise<any[]> {
    const req: McpRequest = {
      jsonrpc: '2.0',
      id: `list-${Date.now()}`,
      method: 'tools/list'
    };
    const res: McpResponse = this.server.handleRequest(req);
    if (res.error) throw new Error(`MCP Error: ${res.error.message}`);
    return res.result.tools;
  }

  public async createDocumentationEntry(args: {
    approval_id: string;
    workspace: string;
    title: string;
    content_markdown: string;
    top_themes?: any[];
  }): Promise<{ document_id: string; document_url: string; title: string }> {
    const req: McpRequest = {
      jsonrpc: '2.0',
      id: `call-doc-${Date.now()}`,
      method: 'tools/call',
      params: {
        name: 'create_documentation_entry',
        arguments: args
      }
    };
    const res: McpResponse = this.server.handleRequest(req);
    if (res.error) throw new Error(`MCP Error: ${res.error.message}`);
    const parsed = JSON.parse(res.result.content[0].text);
    return {
      document_id: parsed.document_id,
      document_url: parsed.document_url,
      title: parsed.title
    };
  }

  public async createStakeholderEmailDraft(args: {
    approval_id: string;
    subject: string;
    executive_summary: string;
    documentation_url: string;
    recipient_group?: string;
  }): Promise<{ draft_id: string; subject: string; is_auto_sent: boolean }> {
    const req: McpRequest = {
      jsonrpc: '2.0',
      id: `call-email-${Date.now()}`,
      method: 'tools/call',
      params: {
        name: 'create_stakeholder_email_draft',
        arguments: args
      }
    };
    const res: McpResponse = this.server.handleRequest(req);
    if (res.error) throw new Error(`MCP Error: ${res.error.message}`);
    const parsed = JSON.parse(res.result.content[0].text);
    return {
      draft_id: parsed.draft_id,
      subject: parsed.subject,
      is_auto_sent: parsed.is_auto_sent
    };
  }
}
