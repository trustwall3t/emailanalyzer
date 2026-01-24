export async function fetchRedditComments(postUrl: string) {
	// Use Reddit's public JSON API - no authentication required!
	// Just append .json to any Reddit URL to get JSON data
	let apiUrl = postUrl.trim();
	
	// Validate it's a Reddit URL
	if (!apiUrl.includes('reddit.com')) {
		throw new Error('Invalid Reddit URL');
	}
	
	try {
		// Ensure URL has protocol
		if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
			apiUrl = `https://${apiUrl}`;
		}
		
		// Remove trailing slash if present
		if (apiUrl.endsWith('/')) {
			apiUrl = apiUrl.slice(0, -1);
		}
		
		// Remove query parameters and hash if present (they interfere with .json)
		try {
			const urlObj = new URL(apiUrl);
			urlObj.search = '';
			urlObj.hash = '';
			apiUrl = urlObj.toString();
		} catch (urlError) {
			// If URL parsing fails, try to clean it manually
			const queryIndex = apiUrl.indexOf('?');
			const hashIndex = apiUrl.indexOf('#');
			const cutIndex = queryIndex !== -1 && hashIndex !== -1
				? Math.min(queryIndex, hashIndex)
				: queryIndex !== -1
				? queryIndex
				: hashIndex !== -1
				? hashIndex
				: -1;
			
			if (cutIndex !== -1) {
				apiUrl = apiUrl.substring(0, cutIndex);
			}
		}
		
		// Remove trailing slash again after cleaning
		if (apiUrl.endsWith('/')) {
			apiUrl = apiUrl.slice(0, -1);
		}
		
		// Handle Reddit shortlinks (e.g., /s/xxxxx)
		// Shortlinks may not work directly with .json, so we'll try to resolve them first
		const isShortlink = apiUrl.includes('/s/');
		
		// Ensure we're using www.reddit.com (more reliable for JSON API)
		apiUrl = apiUrl.replace(/^https?:\/\/(old\.|np\.)?reddit\.com/, 'https://www.reddit.com');
		
		// If it's a shortlink, try to resolve it to the full URL first
		if (isShortlink && !apiUrl.endsWith('.json')) {
			try {
				console.log('Resolving Reddit shortlink:', apiUrl);
				
				// First, try to get the HTML page and extract canonical URL
				const htmlRes = await fetch(apiUrl, {
					method: 'GET',
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
						'Accept': 'text/html,application/xhtml+xml',
					},
					redirect: 'follow',
				});
				
				// Get the final URL after redirects
				let finalUrl = htmlRes.url;
				
				// If redirect didn't give us a /comments/ URL, try extracting from HTML
				if (!finalUrl.includes('/comments/')) {
					const html = await htmlRes.text();
					
					// Try to extract canonical URL from <link rel="canonical">
					const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
					if (canonicalMatch && canonicalMatch[1]) {
						finalUrl = canonicalMatch[1];
						console.log('Extracted canonical URL from HTML:', finalUrl);
					} else {
						// Try to extract from JSON-LD or other meta tags
						const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
						if (jsonLdMatch) {
							try {
								const jsonLd = JSON.parse(jsonLdMatch[1]);
								if (jsonLd.url) {
									finalUrl = jsonLd.url;
									console.log('Extracted URL from JSON-LD:', finalUrl);
								}
							} catch (e) {
								// Ignore JSON parse errors
							}
						}
					}
				}
				
				// Clean up the final URL
				if (finalUrl && finalUrl.includes('/comments/')) {
					// Remove query params and hash
					try {
						const urlObj = new URL(finalUrl);
						urlObj.search = '';
						urlObj.hash = '';
						finalUrl = urlObj.toString();
					} catch (e) {
						// If URL parsing fails, just use as is
					}
					
					// Remove trailing slash
					if (finalUrl.endsWith('/')) {
						finalUrl = finalUrl.slice(0, -1);
					}
					
					console.log('Shortlink resolved to:', finalUrl);
					apiUrl = finalUrl;
				} else {
					console.warn('Could not resolve shortlink to full URL');
				}
			} catch (redirectError) {
				console.warn('Could not resolve shortlink:', redirectError);
				// Continue with original URL - we'll try .json on it
			}
		}
		
		// Append .json if not already present
		if (!apiUrl.endsWith('.json')) {
			apiUrl = `${apiUrl}.json`;
		}

		console.log('Fetching Reddit comments from:', apiUrl);

		const res = await fetch(apiUrl, {
			headers: {
				// Reddit requires a proper User-Agent header
				'User-Agent': 'Mozilla/5.0 (compatible; EmailExtractor/1.0; +https://github.com/yourapp)',
				'Accept': 'application/json',
			},
			// Follow redirects
			redirect: 'follow',
		});

		// Check content type before parsing
		const contentType = res.headers.get('content-type') || '';
		const responseText = await res.text();

		// If we got HTML instead of JSON, something went wrong
		if (!contentType.includes('application/json') || responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
			console.error('Reddit returned HTML instead of JSON:', {
				url: apiUrl,
				contentType,
				status: res.status,
				responsePreview: responseText.substring(0, 200),
				isShortlink,
			});
			
			// Special message for shortlinks
			if (isShortlink) {
				throw new Error(
					'Reddit shortlinks (/s/...) are not supported. Please use the full post URL instead.\n\n' +
					'To get the full URL: Open the Reddit post in your browser and copy the URL from the address bar.\n' +
					'It should look like: https://www.reddit.com/r/subreddit/comments/postid/title/'
				);
			}
			
			// Try to extract error from HTML if possible
			if (res.status === 404) {
				throw new Error('Reddit post not found. Please check the URL and ensure the post exists. If using a shortlink, try the full post URL instead.');
			} else if (res.status === 403) {
				throw new Error('Access denied. The post may be private or removed.');
			} else {
				throw new Error(`Reddit returned HTML instead of JSON (status: ${res.status}). Please use the full post URL format: https://www.reddit.com/r/subreddit/comments/postid/title/`);
			}
		}

		if (!res.ok) {
			let errorData;
			try {
				errorData = JSON.parse(responseText);
			} catch {
				errorData = { message: responseText || res.statusText };
			}
			console.error('Reddit API error:', {
				status: res.status,
				statusText: res.statusText,
				error: errorData,
				url: apiUrl,
			});
			throw new Error(
				`Reddit API error (${res.status}): ${errorData.message || errorData.reason || res.statusText}`
			);
		}

		let data;
		try {
			data = JSON.parse(responseText);
		} catch (parseError) {
			console.error('Failed to parse Reddit JSON response:', {
				url: apiUrl,
				responsePreview: responseText.substring(0, 500),
			});
			throw new Error('Reddit returned invalid JSON. The post may not be accessible or the URL format is incorrect.');
		}

		if (!data || !Array.isArray(data)) {
			console.warn('Reddit API returned invalid response structure:', {
				type: typeof data,
				isArray: Array.isArray(data),
				keys: data ? Object.keys(data) : [],
			});
			return [];
		}

		// Reddit JSON API returns an array where:
		// - data[0] = post data
		// - data[1] = comments data
		if (!data[1] || !data[1].data) {
			console.warn('Reddit API returned no comments:', {
				hasData: !!data[1],
				hasDataData: !!(data[1] && data[1].data),
			});
			return [];
		}

		const comments = data[1].data.children;

		if (!comments || !Array.isArray(comments)) {
			console.warn('Reddit comments array is invalid:', {
				comments: typeof comments,
				isArray: Array.isArray(comments),
			});
			return [];
		}

		// Recursive function to extract all nested comments
		const extractAllComments = (commentNodes: any[]): Array<{
			username: string;
			comment: string;
			platformUserId?: string;
		}> => {
			const allComments: Array<{
				username: string;
				comment: string;
				platformUserId?: string;
			}> = [];

			for (const node of commentNodes) {
				// Skip if it's not a comment (could be "more" objects)
				if (!node.data || node.kind !== 't1') {
					continue;
				}

				const commentData = node.data;

				// Only process valid comments (not deleted/removed)
				if (
					commentData.author &&
					commentData.author !== '[deleted]' &&
					commentData.body &&
					commentData.body !== '[deleted]' &&
					commentData.body !== '[removed]' &&
					commentData.body.trim().length > 0
				) {
					allComments.push({
						username: commentData.author,
						comment: commentData.body,
						platformUserId: commentData.author_fullname || commentData.name,
					});
				}

				// Recursively process replies if they exist
				if (
					commentData.replies &&
					commentData.replies.data &&
					commentData.replies.data.children &&
					Array.isArray(commentData.replies.data.children)
				) {
					const nestedComments = extractAllComments(
						commentData.replies.data.children
					);
					allComments.push(...nestedComments);
				}
			}

			return allComments;
		};

		// Extract all comments including nested replies
		const allComments = extractAllComments(comments);

		console.log(
			`Successfully fetched ${allComments.length} Reddit comments (including nested replies)`
		);
		return allComments;
	} catch (error) {
		console.error('Error fetching Reddit comments:', error);
		if (error instanceof Error) {
			throw error;
		}
		throw new Error(`Failed to fetch Reddit comments: ${String(error)}`);
	}
}
