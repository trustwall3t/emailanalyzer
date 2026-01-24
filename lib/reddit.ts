/**
 * Helper function to fetch with multiple proxy fallbacks for Vercel
 * Tries direct fetch first, then uses multiple proxy services if blocked
 */
async function fetchWithProxyFallback(url: string, options: RequestInit = {}): Promise<Response> {
	const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
	
	// Try direct fetch first
	try {
		const res = await fetch(url, {
			...options,
			signal: AbortSignal.timeout(8000),
		});
		
		// If we got blocked, try proxies on Vercel
		if (res.status === 403 && isVercel) {
			console.log('Got 403, trying proxy fallbacks...');
			
			// Try multiple proxy services (faster ones first)
			const proxyServices = [
				`https://corsproxy.io/?${encodeURIComponent(url)}`, // Usually fastest
				`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, // Raw endpoint is faster
				`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, // Fallback to JSON endpoint
				`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
			];
			
			for (const proxyUrl of proxyServices) {
				try {
					console.log(`Trying proxy: ${proxyUrl.substring(0, 50)}...`);
					
					// Use Promise.race to implement timeout manually for better control
					const controller = new AbortController();
					const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
					
					try {
						const proxyRes = await fetch(proxyUrl, {
							signal: controller.signal,
						});
						
						clearTimeout(timeoutId);
						
						if (proxyRes.ok) {
							// AllOrigins raw format (faster)
							if (proxyUrl.includes('allorigins') && proxyUrl.includes('raw')) {
								const text = await proxyRes.text();
								if (text && !text.trim().startsWith('<!DOCTYPE')) {
									console.log('Proxy succeeded (AllOrigins Raw)');
									return new Response(text, {
										status: 200,
										headers: {
											'content-type': res.headers.get('content-type') || 'application/json',
										},
									});
								}
							}
							// AllOrigins JSON format
							else if (proxyUrl.includes('allorigins')) {
								const proxyData = await proxyRes.json();
								if (proxyData.contents) {
									console.log('Proxy succeeded (AllOrigins JSON)');
									return new Response(proxyData.contents, {
										status: 200,
										headers: {
											'content-type': res.headers.get('content-type') || 'application/json',
										},
									});
								}
							}
							// CORSProxy format (usually fastest)
							else if (proxyUrl.includes('corsproxy')) {
								const text = await proxyRes.text();
								if (text && !text.trim().startsWith('<!DOCTYPE')) {
									console.log('Proxy succeeded (CORSProxy)');
									return new Response(text, {
										status: 200,
										headers: {
											'content-type': res.headers.get('content-type') || 'application/json',
										},
									});
								}
							}
							// CodeTabs format
							else if (proxyUrl.includes('codetabs')) {
								const text = await proxyRes.text();
								if (text && !text.trim().startsWith('<!DOCTYPE')) {
									console.log('Proxy succeeded (CodeTabs)');
									return new Response(text, {
										status: 200,
										headers: {
											'content-type': res.headers.get('content-type') || 'application/json',
										},
									});
								}
							}
						}
					} catch (fetchError) {
						clearTimeout(timeoutId);
						if (fetchError instanceof Error && fetchError.name === 'AbortError') {
							console.log(`Proxy timeout: ${proxyUrl.substring(0, 50)}...`);
						} else {
							throw fetchError;
						}
					}
				} catch (proxyError) {
					console.log(`Proxy failed: ${proxyError instanceof Error ? proxyError.message : String(proxyError)}`);
					continue; // Try next proxy
				}
			}
			
			console.log('All proxies failed, returning original 403 response');
		}
		
		return res;
	} catch (error) {
		// If direct fetch fails and we're on Vercel, try proxies
		if (isVercel) {
			console.log('Direct fetch failed, trying proxy fallbacks...');
			
			const proxyServices = [
				`https://corsproxy.io/?${encodeURIComponent(url)}`, // Usually fastest
				`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, // Raw endpoint is faster
				`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, // Fallback to JSON endpoint
				`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
			];
			
			for (const proxyUrl of proxyServices) {
				try {
					console.log(`Trying proxy: ${proxyUrl.substring(0, 50)}...`);
					
					// Use Promise.race to implement timeout manually for better control
					const controller = new AbortController();
					const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
					
					try {
						const proxyRes = await fetch(proxyUrl, {
							signal: controller.signal,
						});
						
						clearTimeout(timeoutId);
						
					if (proxyRes.ok) {
						// AllOrigins raw format (faster)
						if (proxyUrl.includes('allorigins') && proxyUrl.includes('raw')) {
							const text = await proxyRes.text();
							if (text && !text.trim().startsWith('<!DOCTYPE')) {
								console.log('Proxy succeeded (AllOrigins Raw)');
								return new Response(text, {
									status: 200,
									headers: {
										'content-type': 'application/json',
									},
								});
							}
						}
						// AllOrigins JSON format
						else if (proxyUrl.includes('allorigins')) {
							const proxyData = await proxyRes.json();
							if (proxyData.contents) {
								console.log('Proxy succeeded (AllOrigins JSON)');
								return new Response(proxyData.contents, {
									status: 200,
									headers: {
										'content-type': 'application/json',
									},
								});
							}
						}
						// CORSProxy or CodeTabs (direct text)
						else {
							const text = await proxyRes.text();
							if (text && !text.trim().startsWith('<!DOCTYPE')) {
								console.log('Proxy succeeded');
								return new Response(text, {
									status: 200,
									headers: {
										'content-type': 'application/json',
									},
								});
							}
						}
					}
					} catch (fetchError) {
						clearTimeout(timeoutId);
						if (fetchError instanceof Error && fetchError.name === 'AbortError') {
							console.log(`Proxy timeout: ${proxyUrl.substring(0, 50)}...`);
						} else {
							throw fetchError;
						}
					}
				} catch (proxyError) {
					console.log(`Proxy failed: ${proxyError instanceof Error ? proxyError.message : String(proxyError)}`);
					continue;
				}
			}
		}
		throw error;
	}
}

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
		
		// Ensure we're using www.reddit.com (more reliable for JSON API)
		apiUrl = apiUrl.replace(/^https?:\/\/(old\.|np\.)?reddit\.com/, 'https://www.reddit.com');
		
		// Check for Reddit shortlinks (e.g., /s/xxxxx)
		const isShortlink = apiUrl.includes('/s/');
		
		// If it's a shortlink, try multiple strategies to resolve it
		if (isShortlink && !apiUrl.endsWith('.json')) {
			console.log('Resolving Reddit shortlink:', apiUrl);
			
			let resolved = false;
			let lastError: Error | null = null;
			
			// Strategy 1: Try .json endpoint directly on shortlink (sometimes works even when HTML doesn't)
			try {
				const jsonUrl = `${apiUrl}.json`;
				console.log('Strategy 1: Trying .json endpoint directly:', jsonUrl);
				
				const jsonRes = await fetchWithProxyFallback(jsonUrl, {
					headers: {
						'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
						'Accept': 'application/json',
						'Accept-Language': 'en-US,en;q=0.9',
						'Referer': 'https://www.reddit.com/',
						'Origin': 'https://www.reddit.com',
					},
					redirect: 'follow',
				});
				
				if (jsonRes.ok && jsonRes.headers.get('content-type')?.includes('application/json')) {
					const jsonText = await jsonRes.text();
					if (jsonText && !jsonText.trim().startsWith('<!DOCTYPE') && !jsonText.trim().startsWith('<html')) {
						// Success! We got JSON, extract the permalink from the response
						try {
							const jsonData = JSON.parse(jsonText);
							if (jsonData && jsonData[0] && jsonData[0].data && jsonData[0].data.children && jsonData[0].data.children[0]) {
								const postData = jsonData[0].data.children[0].data;
								if (postData.permalink) {
									const fullUrl = `https://www.reddit.com${postData.permalink}`;
									console.log('Strategy 1 succeeded! Resolved to:', fullUrl);
									apiUrl = fullUrl;
									resolved = true;
								}
							}
						} catch (e) {
							// JSON parse failed, try next strategy
							console.log('Strategy 1: JSON parse failed, trying next strategy');
						}
					}
				}
			} catch (e) {
				console.log('Strategy 1 failed:', e instanceof Error ? e.message : String(e));
				lastError = e instanceof Error ? e : new Error(String(e));
			}
			
			// Strategy 2: Try HTML resolution with minimal headers (less likely to be blocked)
			if (!resolved) {
				try {
					console.log('Strategy 2: Trying HTML resolution with minimal headers');
					
					const htmlRes = await fetchWithProxyFallback(apiUrl, {
						method: 'GET',
						headers: {
							'User-Agent': 'Mozilla/5.0 (compatible; RedditBot/1.0)',
							'Accept': 'text/html',
						},
						redirect: 'follow',
					});
					
					if (htmlRes.ok && htmlRes.status !== 403) {
						let finalUrl = htmlRes.url;
						
						// If redirect didn't give us a /comments/ URL, try extracting from HTML
						if (!finalUrl.includes('/comments/')) {
							const html = await htmlRes.text();
							
							// Try to extract canonical URL
							const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
							if (canonicalMatch && canonicalMatch[1]) {
								finalUrl = canonicalMatch[1];
							} else {
								// Try JSON-LD
								const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
								if (jsonLdMatch) {
									try {
										const jsonLd = JSON.parse(jsonLdMatch[1]);
										if (jsonLd.url) {
											finalUrl = jsonLd.url;
										}
									} catch (e) {
										// Ignore
									}
								}
							}
						}
						
						if (finalUrl && finalUrl.includes('/comments/')) {
							try {
								const urlObj = new URL(finalUrl);
								urlObj.search = '';
								urlObj.hash = '';
								finalUrl = urlObj.toString();
							} catch (e) {
								// Ignore
							}
							
							if (finalUrl.endsWith('/')) {
								finalUrl = finalUrl.slice(0, -1);
							}
							
							console.log('Strategy 2 succeeded! Resolved to:', finalUrl);
							apiUrl = finalUrl;
							resolved = true;
						}
					}
				} catch (e) {
					console.log('Strategy 2 failed:', e instanceof Error ? e.message : String(e));
					lastError = e instanceof Error ? e : new Error(String(e));
				}
			}
			
			// Strategy 3: Try HTML resolution with full browser headers (last resort)
			if (!resolved) {
				try {
					console.log('Strategy 3: Trying HTML resolution with full browser headers');
					
					const htmlRes = await fetchWithProxyFallback(apiUrl, {
						method: 'GET',
						headers: {
							'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
							'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
							'Accept-Language': 'en-US,en;q=0.9',
							'Accept-Encoding': 'gzip, deflate, br',
							'Referer': 'https://www.reddit.com/',
							'DNT': '1',
							'Connection': 'keep-alive',
							'Upgrade-Insecure-Requests': '1',
							'Sec-Fetch-Dest': 'document',
							'Sec-Fetch-Mode': 'navigate',
							'Sec-Fetch-Site': 'none',
							'Sec-Fetch-User': '?1',
						},
						redirect: 'follow',
					});
					
					if (htmlRes.ok && htmlRes.status !== 403) {
						let finalUrl = htmlRes.url;
						
						if (!finalUrl.includes('/comments/')) {
							const html = await htmlRes.text();
							const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
							if (canonicalMatch && canonicalMatch[1]) {
								finalUrl = canonicalMatch[1];
							}
						}
						
						if (finalUrl && finalUrl.includes('/comments/')) {
							try {
								const urlObj = new URL(finalUrl);
								urlObj.search = '';
								urlObj.hash = '';
								finalUrl = urlObj.toString();
							} catch (e) {
								// Ignore
							}
							
							if (finalUrl.endsWith('/')) {
								finalUrl = finalUrl.slice(0, -1);
							}
							
							console.log('Strategy 3 succeeded! Resolved to:', finalUrl);
							apiUrl = finalUrl;
							resolved = true;
						}
					} else if (htmlRes.status === 403) {
						// Got blocked, but don't throw yet - we'll handle it below
						console.log('Strategy 3: Got 403 Forbidden');
					}
				} catch (e) {
					console.log('Strategy 3 failed:', e instanceof Error ? e.message : String(e));
					lastError = e instanceof Error ? e : new Error(String(e));
				}
			}
			
			// If all strategies failed, throw a helpful error
			if (!resolved) {
				const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
				
				if (isVercel) {
					throw new Error(
						'Unable to resolve Reddit shortlink on Vercel. Reddit may be blocking server requests.\n\n' +
						'Please try using the full post URL:\n' +
						'1. Open the Reddit post in your browser\n' +
						'2. Copy the full URL from the address bar\n' +
						'3. Format: https://www.reddit.com/r/subreddit/comments/postid/title/'
					);
				} else {
					throw new Error(
						'Could not resolve Reddit shortlink. Please use the full post URL instead.\n\n' +
						'To get the full URL:\n' +
						'1. Open the Reddit post in your browser\n' +
						'2. Copy the URL from the address bar\n' +
						'3. It should look like: https://www.reddit.com/r/subreddit/comments/postid/title/'
					);
				}
			}
		}
		
		// Append .json if not already present
		if (!apiUrl.endsWith('.json')) {
			apiUrl = `${apiUrl}.json`;
		}

		// Validate URL format - must be a /comments/ URL
		if (!apiUrl.includes('/comments/')) {
			throw new Error(
				'Invalid Reddit URL format. Please use the full post URL with /comments/ in the path.\n\n' +
				'Example: https://www.reddit.com/r/subreddit/comments/postid/title/\n\n' +
				'If you used a shortlink, it may not have resolved correctly. Please use the full URL.'
			);
		}

		console.log('Fetching Reddit comments from:', apiUrl);

		// Use realistic browser headers to avoid being blocked
		// Note: Reddit may still block server-side requests from certain IP ranges
		// fetchWithProxyFallback will automatically use proxy on Vercel if blocked
		const res = await fetchWithProxyFallback(apiUrl, {
			headers: {
				// Realistic browser User-Agent
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'Accept': 'application/json',
				'Accept-Language': 'en-US,en;q=0.9',
				'Accept-Encoding': 'gzip, deflate, br',
				'Referer': 'https://www.reddit.com/',
				'Origin': 'https://www.reddit.com',
				'DNT': '1',
				'Connection': 'keep-alive',
				'Sec-Fetch-Dest': 'empty',
				'Sec-Fetch-Mode': 'cors',
				'Sec-Fetch-Site': 'same-origin',
				'Cache-Control': 'no-cache',
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
			});
			
			// Handle specific error status codes
			if (res.status === 403) {
				// 403 Forbidden - Reddit is blocking the request
				throw new Error(
					'Reddit is blocking access to this post (403 Forbidden).\n\n' +
					'This typically happens when:\n' +
					'• Reddit detects server-side requests from certain IP ranges\n' +
					'• The post is private, restricted, or removed\n' +
					'• Reddit is rate-limiting requests\n\n' +
					'Possible solutions:\n' +
					'1. Wait a few minutes and try again\n' +
					'2. Ensure you\'re using the full post URL (not a shortlink)\n' +
					'3. Verify the post is public and accessible\n' +
					'4. Try a different Reddit post\n\n' +
					'URL format should be: https://www.reddit.com/r/subreddit/comments/postid/title/'
				);
			} else if (res.status === 404) {
				throw new Error(
					'Reddit post not found (404). Please check:\n' +
					'• The URL is correct and complete\n' +
					'• The post exists and is accessible\n' +
					'• You\'re using the full URL format: https://www.reddit.com/r/subreddit/comments/postid/title/'
				);
			} else if (res.status === 429) {
				throw new Error(
					'Reddit rate limit exceeded.\n\n' +
					'Please wait 5-10 minutes before trying again. Reddit limits the number of requests from the same source.'
				);
			} else {
				throw new Error(
					`Reddit returned an error (status: ${res.status}).\n\n` +
					'Please ensure:\n' +
					'• You\'re using the full post URL (not a shortlink)\n' +
					'• The URL format is: https://www.reddit.com/r/subreddit/comments/postid/title/\n' +
					'• The post is public and accessible\n' +
					'• Try again in a few minutes'
				);
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
