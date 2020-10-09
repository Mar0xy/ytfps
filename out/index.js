"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const axios_1 = __importDefault(require("axios"));
const rqOpts = {
    headers: {
        'User-Agent': 'hellobiczes',
        'x-youtube-client-name': 1,
        'x-youtube-client-version': '2.20200731.02.01'
    }
};
const baseURL = 'https://youtube.com';
/**
 * Scraps youtube playlist metadata and all its videos
 * @param url URL or ID of the playlist you want to scrap
 */
async function fetchFromPlaylist(url) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
    let test = /[?&]list=([^#\&\?]+)|^([a-zA-Z0-9-_]+)$/.exec(url);
    if (!test)
        throw Error('Invalid playlist URL or ID');
    let playlistID = test[1] || test[2];
    let videos = [];
    let ytInitialData;
    try {
        let body = (await axios_1.default.get('https://youtube.com/playlist?list=' + encodeURI(playlistID), rqOpts)).data;
        ytInitialData = JSON.parse(((_a = /window\["ytInitialData"].*?({.*?});/s.exec(body)) === null || _a === void 0 ? void 0 : _a[1]) || '{}');
    }
    catch (_w) {
        throw Error('Could not fetch/parse playlist');
    }
    if (ytInitialData.alerts)
        throw Error('This playlist is private');
    if (!((_o = (_m = (_l = (_k = (_j = (_h = (_g = (_f = (_e = (_d = (_c = (_b = ytInitialData === null || ytInitialData === void 0 ? void 0 : ytInitialData.contents) === null || _b === void 0 ? void 0 : _b.twoColumnBrowseResultsRenderer) === null || _c === void 0 ? void 0 : _c.tabs) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.tabRenderer) === null || _f === void 0 ? void 0 : _f.content) === null || _g === void 0 ? void 0 : _g.sectionListRenderer) === null || _h === void 0 ? void 0 : _h.contents) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.itemSectionRenderer) === null || _l === void 0 ? void 0 : _l.contents) === null || _m === void 0 ? void 0 : _m[0]) === null || _o === void 0 ? void 0 : _o.playlistVideoListRenderer))
        throw Error('Cannot find valid playlist JSON data. Is the playlist ID correct?');
    let listData = ytInitialData.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer;
    let d = ytInitialData;
    if (listData.contents)
        videos.push(...parseVideosFromJson(listData.contents));
    let contToken = ((_r = (_q = (_p = listData === null || listData === void 0 ? void 0 : listData.continuations) === null || _p === void 0 ? void 0 : _p[0]) === null || _q === void 0 ? void 0 : _q.nextContinuationData) === null || _r === void 0 ? void 0 : _r.continuation) || '';
    if (contToken)
        videos.push(...(await getAllVideos(contToken)));
    try {
        let mf = d.microformat.microformatDataRenderer;
        let si0 = d.sidebar.playlistSidebarRenderer.items[0].playlistSidebarPrimaryInfoRenderer;
        let si1 = d.sidebar.playlistSidebarRenderer.items[1].playlistSidebarSecondaryInfoRenderer.videoOwner.videoOwnerRenderer;
        return {
            title: mf.title,
            url: baseURL + '/playlist?list=' + listData.playlistId,
            id: listData.playlistId,
            video_count: +((_t = (_s = si0.stats[0].runs[0]) === null || _s === void 0 ? void 0 : _s.text) === null || _t === void 0 ? void 0 : _t.replace(/[^0-9]/g, '')),
            view_count: +((_v = (_u = si0.stats[1]) === null || _u === void 0 ? void 0 : _u.simpleText) === null || _v === void 0 ? void 0 : _v.replace(/[^0-9]/g, '')) || 0,
            description: mf.description,
            isUnlisted: mf.unlisted,
            thumbnail_url: mf.thumbnail.thumbnails.pop().url.replace(/\?.*/, ''),
            author: {
                name: si1.title.runs[0].text,
                url: baseURL + si1.title.runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url,
                avatar_url: si1.thumbnail.thumbnails.pop().url
            },
            videos: videos
        };
    }
    catch (e) {
        throw Error('Could not parse playlist metadata: ' + e.message);
    }
}
function parseVideosFromJson(videoDataArray) {
    try {
        let videos = [];
        for (let v of videoDataArray.map(v => v.playlistVideoRenderer))
            try {
                videos.push({
                    title: v.title.runs[0].text,
                    url: baseURL + '/watch?v=' + v.videoId,
                    id: v.videoId,
                    length: v.lengthText.simpleText,
                    milis_length: +v.lengthSeconds * 1000,
                    thumbnail_url: 'https://i.ytimg.com/vi/' + v.videoId + '/hqdefault.jpg',
                    author: {
                        name: v.shortBylineText.runs[0].text,
                        url: baseURL + v.shortBylineText.runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url
                    }
                });
            }
            catch (_a) {
                continue;
            }
        return videos;
    }
    catch (_b) {
        throw Error('Could not parse videos from videoData JSON');
    }
}
async function getAllVideos(ajax_url, videos = []) {
    var _a, _b, _c, _d;
    try {
        let ytAppendData = (await axios_1.default.get(baseURL + '/browse_ajax?continuation=' + ajax_url, rqOpts)).data;
        videos.push(...parseVideosFromJson(ytAppendData[1].response.continuationContents.playlistVideoListContinuation.contents));
        let contToken = (_d = (_c = (_b = (_a = ytAppendData[1].response.continuationContents.playlistVideoListContinuation) === null || _a === void 0 ? void 0 : _a.continuations) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.nextContinuationData) === null || _d === void 0 ? void 0 : _d.continuation;
        return contToken ? await getAllVideos(contToken, videos) : videos;
    }
    catch (_e) {
        throw Error('An error has occured while trying to fetch more videos');
    }
}
module.exports = fetchFromPlaylist;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLGtEQUErQztBQUsvQyxNQUFNLE1BQU0sR0FBdUI7SUFDL0IsT0FBTyxFQUFFO1FBQ0wsWUFBWSxFQUFFLGFBQWE7UUFDM0IsdUJBQXVCLEVBQUUsQ0FBQztRQUMxQiwwQkFBMEIsRUFBRSxrQkFBa0I7S0FDakQ7Q0FDSixDQUFBO0FBRUQsTUFBTSxPQUFPLEdBQUcscUJBQXFCLENBQUM7QUFFdEM7OztHQUdHO0FBQ0gsS0FBSyxVQUFVLGlCQUFpQixDQUFDLEdBQVc7O0lBQ3hDLElBQUksSUFBSSxHQUFHLHlDQUF5QyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMvRCxJQUFHLENBQUMsSUFBSTtRQUNKLE1BQU0sS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7SUFDOUMsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQyxJQUFJLE1BQU0sR0FBYyxFQUFFLENBQUM7SUFDM0IsSUFBSSxhQUFrQixDQUFDO0lBRXZCLElBQUk7UUFDQSxJQUFJLElBQUksR0FBRyxDQUFDLE1BQU0sZUFBRSxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFjLENBQUM7UUFDL0csYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBQSxzQ0FBc0MsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLDBDQUFHLENBQUMsTUFBSyxJQUFJLENBQUMsQ0FBQztLQUM5RjtJQUFDLFdBQU07UUFDSixNQUFNLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0tBQ2pEO0lBRUQsSUFBRyxhQUFhLENBQUMsTUFBTTtRQUNuQixNQUFNLEtBQUssQ0FBQywwQkFBMEIs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Q2pCO0lBQUMsV0FBTTtRQUNKLE1BQU0sS0FBSyxDQUFDLDRDQUE0QyxDQUFDLENBQUM7S0FDN0Q7QUFDTCxDQUFDO0FBRUQsS0FBSyxVQUFVLFlBQVksQ0FBQyxRQUFnQixFQUFFLFNBQW9CLEVBQUU7O0lBQ2hFLElBQUk7UUFDQSxJQUFJLFlBQVksR0FBRyxDQUFDLE1BQU0sZUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUcsNEJBQTRCLEdBQUcsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ2xHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLDZCQUE2QixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDMUgsSUFBSSxTQUFTLDJCQUFXLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsNkJBQTZCLDBDQUFFLGFBQWEsMENBQUcsQ0FBQywyQ0FBRyxvQkFBb0IsMENBQUUsWUFBWSxDQUFDO1FBQzVKLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLFlBQVksQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztLQUNyRTtJQUFDLFdBQU07UUFDSixNQUFNLEtBQUssQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO0tBQ3pFO0FBQ0wsQ0FBQztBQXhHRCxpQkFBUyxpQkFBaUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBheCwgeyBBeGlvc1JlcXVlc3RDb25maWcgfSBmcm9tICdheGlvcyc7XHJcbmltcG9ydCB7IFlUUGxheWxpc3QsIFlUdmlkZW8gfSBmcm9tICcuL2ludGVyZmFjZXMnO1xyXG5cclxuZXhwb3J0ID0gZmV0Y2hGcm9tUGxheWxpc3Q7XHJcblxyXG5jb25zdCBycU9wdHM6IEF4aW9zUmVxdWVzdENvbmZpZyA9IHtcclxuICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAnVXNlci1BZ2VudCc6ICdoZWxsb2JpY3plcycsXHJcbiAgICAgICAgJ3gteW91dHViZS1jbGllbnQtbmFtZSc6IDEsXHJcbiAgICAgICAgJ3gteW91dHViZS1jbGllbnQtdmVyc2lvbic6ICcyLjIwMjAwNzMxLjAyLjAxJ1xyXG4gICAgfVxyXG59XHJcblxyXG5jb25zdCBiYXNlVVJMID0gJ2h0dHBzOi8veW91dHViZS5jb20nO1xyXG5cclxuLyoqXHJcbiAqIFNjcmFwcyB5b3V0dWJlIHBsYXlsaXN0IG1ldGFkYXRhIGFuZCBhbGwgaXRzIHZpZGVvc1xyXG4gKiBAcGFyYW0gdXJsIFVSTCBvciBJRCBvZiB0aGUgcGxheWxpc3QgeW91IHdhbnQgdG8gc2NyYXBcclxuICovXHJcbmFzeW5jIGZ1bmN0aW9uIGZldGNoRnJvbVBsYXlsaXN0KHVybDogc3RyaW5nKSA6IFByb21pc2U8WVRQbGF5bGlzdD4ge1xyXG4gICAgbGV0IHRlc3QgPSAvWz8mXWxpc3Q9KFteI1xcJlxcP10rKXxeKFthLXpBLVowLTktX10rKSQvLmV4ZWModXJsKTtcclxuICAgIGlmKCF0ZXN0KVxyXG4gICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHBsYXlsaXN0IFVSTCBvciBJRCcpO1xyXG4gICAgbGV0IHBsYXlsaXN0SUQgPSB0ZXN0WzFdIHx8IHRlc3RbMl07XHJcbiAgICBsZXQgdmlkZW9zOiBZVHZpZGVvW10gPSBbXTtcclxuICAgIGxldCB5dEluaXRpYWxEYXRhOiBhbnk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBsZXQgYm9keSA9IChhd2FpdCBheC5nZXQoJ2h0dHBzOi8veW91dHViZS5jb20vcGxheWxpc3Q/bGlzdD0nICsgZW5jb2RlVVJJKHBsYXlsaXN0SUQpLCBycU9wdHMpKS5kYXRhIGFzIHN0cmluZztcclxuICAgICAgICB5dEluaXRpYWxEYXRhID0gSlNPTi5wYXJzZSgvd2luZG93XFxbXCJ5dEluaXRpYWxEYXRhXCJdLio/KHsuKj99KTsvcy5leGVjKGJvZHkpPy5bMV0gfHwgJ3t9Jyk7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgICB0aHJvdyBFcnJvcignQ291bGQgbm90IGZldGNoL3BhcnNlIHBsYXlsaXN0Jyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYoeXRJbml0aWFsRGF0YS5hbGVydHMpXHJcbiAgICAgICAgdGhyb3cgRXJyb3IoJ1RoaXMgcGxheWxpc3QgaXMgcHJpdmF0ZScpO1xyXG4gICAgaWYoIXl0SW5pdGlhbERhdGE/LmNvbnRlbnRzPy50d29Db2x1bW5Ccm93c2VSZXN1bHRzUmVuZGVyZXI/LnRhYnM/LlswXT8udGFiUmVuZGVyZXI/LmNvbnRlbnQ/LnNlY3Rpb25MaXN0UmVuZGVyZXI/LmNvbnRlbnRzPy5bMF0/Lml0ZW1TZWN0aW9uUmVuZGVyZXI/LmNvbnRlbnRzPy5bMF0/LnBsYXlsaXN0VmlkZW9MaXN0UmVuZGVyZXIpXHJcbiAgICAgICAgdGhyb3cgRXJyb3IoJ0Nhbm5vdCBmaW5kIHZhbGlkIHBsYXlsaXN0IEpTT04gZGF0YS4gSXMgdGhlIHBsYXlsaXN0IElEIGNvcnJlY3Q/Jyk7XHJcbiAgICBsZXQgbGlzdERhdGEgPSB5dEluaXRpYWxEYXRhLmNvbnRlbnRzLnR3b0NvbHVtbkJyb3dzZVJlc3VsdHNSZW5kZXJlci50YWJzWzBdLnRhYlJlbmRlcmVyLmNvbnRlbnQuc2VjdGlvbkxpc3RSZW5kZXJlci5jb250ZW50c1swXS5pdGVtU2VjdGlvblJlbmRlcmVyLmNvbnRlbnRzWzBdLnBsYXlsaXN0VmlkZW9MaXN0UmVuZGVyZXI7XHJcbiAgICBsZXQgZCA9IHl0SW5pdGlhbERhdGE7XHJcbiAgICBcclxuICAgIGlmKGxpc3REYXRhLmNvbnRlbnRzKVxyXG4gICAgICAgIHZpZGVvcy5wdXNoKC4uLnBhcnNlVmlkZW9zRnJvbUpzb24obGlzdERhdGEuY29udGVudHMpKTtcclxuICAgIGxldCBjb250VG9rZW46IHN0cmluZyA9IGxpc3REYXRhPy5jb250aW51YXRpb25zPy5bMF0/Lm5leHRDb250aW51YXRpb25EYXRhPy5jb250aW51YXRpb24gfHwgJyc7XHJcbiAgICBpZihjb250VG9rZW4pXHJcbiAgICAgICAgdmlkZW9zLnB1c2goLi4uKGF3YWl0IGdldEFsbFZpZGVvcyhjb250VG9rZW4pKSk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBsZXQgbWYgPSBkLm1pY3JvZm9ybWF0Lm1pY3JvZm9ybWF0RGF0YVJlbmRlcmVyO1xyXG4gICAgICAgIGxldCBzaTAgPSBkLnNpZGViYXIucGxheWxpc3RTaWRlYmFyUmVuZGVyZXIuaXRlbXNbMF0ucGxheWxpc3RTaWRlYmFyUHJpbWFyeUluZm9SZW5kZXJlcjtcclxuICAgICAgICBsZXQgc2kxID0gZC5zaWRlYmFyLnBsYXlsaXN0U2lkZWJhclJlbmRlcmVyLml0ZW1zWzFdLnBsYXlsaXN0U2lkZWJhclNlY29uZGFyeUluZm9SZW5kZXJlci52aWRlb093bmVyLnZpZGVvT3duZXJSZW5kZXJlcjtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0aXRsZTogbWYudGl0bGUsXHJcbiAgICAgICAgICAgIHVybDogYmFzZVVSTCArICcvcGxheWxpc3Q/bGlzdD0nICsgbGlzdERhdGEucGxheWxpc3RJZCxcclxuICAgICAgICAgICAgaWQ6IGxpc3REYXRhLnBsYXlsaXN0SWQsXHJcbiAgICAgICAgICAgIHZpZGVvX2NvdW50OiArc2kwLnN0YXRzWzBdLnJ1bnNbMF0/LnRleHQ/LnJlcGxhY2UoL1teMC05XS9nLCAnJyksXHJcbiAgICAgICAgICAgIHZpZXdfY291bnQ6ICtzaTAuc3RhdHNbMV0/LnNpbXBsZVRleHQ/LnJlcGxhY2UoL1teMC05XS9nLCAnJykgfHwgMCxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IG1mLmRlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgICBpc1VubGlzdGVkOiBtZi51bmxpc3RlZCxcclxuICAgICAgICAgICAgdGh1bWJuYWlsX3VybDogbWYudGh1bWJuYWlsLnRodW1ibmFpbHMucG9wKCkudXJsLnJlcGxhY2UoL1xcPy4qLywgJycpLFxyXG4gICAgICAgICAgICBhdXRob3I6IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IHNpMS50aXRsZS5ydW5zWzBdLnRleHQsXHJcbiAgICAgICAgICAgICAgICB1cmw6IGJhc2VVUkwgKyBzaTEudGl0bGUucnVuc1swXS5uYXZpZ2F0aW9uRW5kcG9pbnQuY29tbWFuZE1ldGFkYXRhLndlYkNvbW1hbmRNZXRhZGF0YS51cmwsXHJcbiAgICAgICAgICAgICAgICBhdmF0YXJfdXJsOiBzaTEudGh1bWJuYWlsLnRodW1ibmFpbHMucG9wKCkudXJsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHZpZGVvczogdmlkZW9zXHJcbiAgICAgICAgfVxyXG4gICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoJ0NvdWxkIG5vdCBwYXJzZSBwbGF5bGlzdCBtZXRhZGF0YTogJyArIGUubWVzc2FnZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlVmlkZW9zRnJvbUpzb24odmlkZW9EYXRhQXJyYXk6IGFueVtdKSA6IFlUdmlkZW9bXSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGxldCB2aWRlb3M6IFlUdmlkZW9bXSA9IFtdO1xyXG4gICAgICAgIGZvcihsZXQgdiBvZiB2aWRlb0RhdGFBcnJheS5tYXAodiA9PiB2LnBsYXlsaXN0VmlkZW9SZW5kZXJlcikpXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB2aWRlb3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHYudGl0bGUucnVuc1swXS50ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgIHVybDogYmFzZVVSTCArICcvd2F0Y2g/dj0nICsgdi52aWRlb0lkLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkOiB2LnZpZGVvSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgbGVuZ3RoOiB2Lmxlbmd0aFRleHQuc2ltcGxlVGV4dCxcclxuICAgICAgICAgICAgICAgICAgICBtaWxpc19sZW5ndGg6ICt2Lmxlbmd0aFNlY29uZHMgKiAxMDAwLFxyXG4gICAgICAgICAgICAgICAgICAgIHRodW1ibmFpbF91cmw6ICdodHRwczovL2kueXRpbWcuY29tL3ZpLycgKyB2LnZpZGVvSWQgKyAnL2hxZGVmYXVsdC5qcGcnLFxyXG4gICAgICAgICAgICAgICAgICAgIGF1dGhvcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB2LnNob3J0QnlsaW5lVGV4dC5ydW5zWzBdLnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogYmFzZVVSTCArIHYuc2hvcnRCeWxpbmVUZXh0LnJ1bnNbMF0ubmF2aWdhdGlvbkVuZHBvaW50LmNvbW1hbmRNZXRhZGF0YS53ZWJDb21tYW5kTWV0YWRhdGEudXJsXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9ICAgKTtcclxuICAgICAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB2aWRlb3M7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgICB0aHJvdyBFcnJvcignQ291bGQgbm90IHBhcnNlIHZpZGVvcyBmcm9tIHZpZGVvRGF0YSBKU09OJyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldEFsbFZpZGVvcyhhamF4X3VybDogc3RyaW5nLCB2aWRlb3M6IFlUdmlkZW9bXSA9IFtdKSA6IFByb21pc2U8WVR2aWRlb1tdPiB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGxldCB5dEFwcGVuZERhdGEgPSAoYXdhaXQgYXguZ2V0KGJhc2VVUkwgKyAnL2Jyb3dzZV9hamF4P2NvbnRpbnVhdGlvbj0nICsgYWpheF91cmwsIHJxT3B0cykpLmRhdGE7XHJcbiAgICAgICAgdmlkZW9zLnB1c2goLi4ucGFyc2VWaWRlb3NGcm9tSnNvbih5dEFwcGVuZERhdGFbMV0ucmVzcG9uc2UuY29udGludWF0aW9uQ29udGVudHMucGxheWxpc3RWaWRlb0xpc3RDb250aW51YXRpb24uY29udGVudHMpKTtcclxuICAgICAgICBsZXQgY29udFRva2VuOiBzdHJpbmcgPSB5dEFwcGVuZERhdGFbMV0ucmVzcG9uc2UuY29udGludWF0aW9uQ29udGVudHMucGxheWxpc3RWaWRlb0xpc3RDb250aW51YXRpb24/LmNvbnRpbnVhdGlvbnM/LlswXT8ubmV4dENvbnRpbnVhdGlvbkRhdGE/LmNvbnRpbnVhdGlvbjtcclxuICAgICAgICByZXR1cm4gY29udFRva2VuID8gYXdhaXQgZ2V0QWxsVmlkZW9zKGNvbnRUb2tlbiwgdmlkZW9zKSA6IHZpZGVvcztcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICAgIHRocm93IEVycm9yKCdBbiBlcnJvciBoYXMgb2NjdXJlZCB3aGlsZSB0cnlpbmcgdG8gZmV0Y2ggbW9yZSB2aWRlb3MnKTtcclxuICAgIH1cclxufSJdfQ==