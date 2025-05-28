import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DB_ID!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      // Optionally, add filters/sorts here
      page_size: 100,
    });

    const articles = response.results.map((page: any) => ({
      title: page.properties.Name?.title?.[0]?.plain_text || '',
      url: page.properties.URL?.url || '',
      tags: page.properties.Tags?.multi_select?.map((t: any) => t.name) || [],
      mainTag: page.properties.MainTag?.select?.name || '',
      created: page.properties.Created?.date?.start || page.created_time,
      content: page.properties.SummarizedText?.rich_text?.[0]?.plain_text || '',
      notionUrl: page.url,
    }));

    res.status(200).json(articles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
