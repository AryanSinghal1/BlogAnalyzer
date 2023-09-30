const express = require('express');
var lodash = require('lodash');
const app = express();
const port = process.env.PORT || 8000;
const options = {
    method: 'GET',
    headers: {
      'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'
    }
  };

const fetchIt = (req, res, next) => {
    try{
        fetch('https://intent-kit-16.hasura.app/api/rest/blogs', options)
        .then(response => response.json())
        .then(response => {
            req.api = response;
            next();
        })
        .catch(err => console.log(err));
    }catch(error){
        console.log(error);
    }
} 

const analyzeData = (apiData) => {
    const blogSize = lodash.size(apiData.blogs); 
    const maximumTitleBlog = lodash.maxBy(apiData.blogs, (obj) => lodash.size(obj.title));
    const blogsWithPrivacy = lodash.filter(apiData.blogs, (obj) => lodash.includes(obj.title.toLowerCase(), 'privacy'));
    const blogsWithPrivacySize = lodash.size(blogsWithPrivacy);
    const uniqueBlogTitles = lodash.uniq(lodash.map(apiData.blogs, (obj) => obj.title));
    return {blogSize, maximumTitleBlog, blogsWithPrivacySize, uniqueBlogTitles};
}

app.get("/api/blog-stats", fetchIt, (req, res)=>{
    const apiData = req.api;
    if(!apiData.blogs){
        res.json({
            error: 'API Error'
        })
    }
    const memoizeData = lodash.memoize(analyzeData);
    const processedData = memoizeData(apiData);
    const { blogSize, maximumTitleBlog, blogsWithPrivacySize, uniqueBlogTitles } = processedData;
    if(!blogSize || !maximumTitleBlog || !blogsWithPrivacySize || !uniqueBlogTitles){
        res.json({
            error: 'Error in Analysing the Blogs'
        })
    }
    if(apiData.blogs && blogSize && maximumTitleBlog && blogsWithPrivacySize && uniqueBlogTitles){
        res.json({
            total_blogs: blogSize,
            longest_blog_title: maximumTitleBlog.title,
            number_of_blogs_with_privacy_in_title: blogsWithPrivacySize,
            unique_blog_titles: uniqueBlogTitles
        })
    }
})

const searchBlogData = (apiData, query) => {
    const blogSearch = lodash.filter(apiData.blogs, (obj) => lodash.includes(obj.title.toLowerCase(), query));
    return blogSearch;
}

app.get("/api/blog-search", fetchIt, (req, res)=>{
    const searchQuery = req.query.query;
    if(!searchQuery){
        res.json({
            error: "Please Enter Query"
        })
    }
    const memoizeData = lodash.memoize(searchBlogData);
    const blogSearch = memoizeData(req.api, searchQuery);
    if(!lodash.size(blogSearch)){
        res.json({
            error: "0 Results Found"
        })
    }
    if(searchQuery && lodash.size(blogSearch)){
        res.json({
            blogs: blogSearch
        })
    }

})

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})