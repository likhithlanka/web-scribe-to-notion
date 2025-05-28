# Bookmarks Automation for Product Portfolio – Product Requirements Document (PRD)

## 1. Purpose
As a product manager, I want my portfolio to reflect not just my work, but also my curiosity and learning journey. A bookmarks page, powered by automation and AI, helps me showcase what I read, why I find it interesting, and how I organize knowledge—demonstrating my product thinking and technical skills.

## 2. Problem & Pain Points
| Pain Point | Description | Feature Solution |
|------------|-------------|------------------|
| Bookmarks lack context | Traditional bookmarks only save a URL and title, making it hard to remember why it was saved | AI-generated summaries for each bookmark |
| Hard to organize & retrieve | Bookmarks become a long, unstructured list, making it difficult to find or group related content | Tagging and main tag grouping |
| Visually bland | Plain bookmarks are uninspiring and hard to scan | Cover images from Unsplash based on tags |
| Manual effort | Saving, summarizing, and organizing bookmarks is tedious | Automated workflow from save to Notion |
| No insight into interests | Recruiters can’t see what topics I care about or follow | Public, always-updated Notion bookmarks page |

## 3. Goals
- Make my interests and learning visible to recruiters and peers
- Reduce friction in saving and organizing knowledge
- Demonstrate product thinking and technical execution

## 4. User Stories
- As a recruiter, I want to see what topics the candidate is reading about, so I can understand their interests and industry awareness.
- As a product manager, I want to save articles with context and easy retrieval, so I can revisit and share them later.

## 5. Features Table
| Feature | Pain Point Addressed | Description |
|---------|---------------------|-------------|
| AI Summarization | Bookmarks lack context | Each bookmark includes a concise, AI-generated summary explaining what the page is about and why it matters |
| Tagging & Main Tag | Hard to organize & retrieve | AI suggests up to 5 tags and a main tag for high-level grouping, enabling filtering and search in Notion |
| Cover Image | Visually bland | Fetches a relevant Unsplash image using tags, making each bookmark visually distinct |
| Automated Save to Notion | Manual effort | The entire process (summarize, tag, fetch image, save) is automated via a Supabase Edge Function |
| Public Notion Page | No insight into interests | Bookmarks are displayed in a Notion database, always up-to-date and easy to browse |

## 6. How It Works
1. I trigger a save (via extension or API)
2. The system extracts the page title, URL, and content
3. AI summarizes the content and suggests tags
4. Unsplash provides a cover image based on tags
5. All data is saved as a new page in Notion, with tags and main tag for grouping
6. The Notion page is public, letting anyone see what I’m reading and why

## 7. Future Enhancements (from pain points)
| Pain Point | Potential Feature |
|------------|------------------|
| Want to add personal notes | Allow commentary on each bookmark |
| Want to share with others | Social sharing or RSS feed |
| Want to analyze reading trends | Analytics dashboard |
| Want to save from mobile | Mobile integration |

## 8. Success Metrics
- Number of bookmarks saved
- Recruiter feedback on portfolio depth
- Time saved in organizing bookmarks
- Engagement with the public Notion page

---
*This bookmarks page is a living demonstration of my curiosity, product thinking, and ability to solve real user pain points with simple, effective solutions.*
