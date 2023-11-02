const fbData = require("../../facebookData.json");
const db = require('../../database/db');
const axios = require('axios');
require("dotenv").config();
const baseUrl = process.env.BASEURL;
const YOUTUBE_APIKEY = process.env.YOUTUBE_APIKEY;

exports.getFacebookGiveawayWinner = async (req, res) => {
  try {
    let fbDataArray = fbData.data;

    let giveaway_post = fbDataArray[0].full_picture;
    let giveaway_type = "facebook";
    let author = "gfd";

    let fbComments = fbDataArray[0].comments.data;
    let total_participants = fbComments.length;

    let winner = fbComments[Math.floor(Math.random() * fbComments.length)];

    let winner_user = winner.from.name
    let winner_user_comment = winner.message

    const insert_sql =
      "INSERT INTO `giveaway_details` SET giveaway_type=?,total_participants=?,author=?, giveaway_post=?, winner_user=?,winner_user_comment=?";
    const result = await db.query(insert_sql, [
      giveaway_type,
      total_participants,
      author,
      giveaway_post,
      winner_user,
      winner_user_comment 
    ]);

  
    let resObj = {
      winnerName: winner.from.name,
      comment: winner.message,
    };
    res.status(200).send({
      status: true,
      result: resObj,
      message: "Facebook Giveaway winner user",
      errors: "",
    });
  } catch (error) {
    res.status(500).send({
      status: false,
      result: "",
      errors: " Error: " + error,
      errorData: error,
    });
  }
};

exports.getYoutubeVideoInfo = async (req, res) => {
  const  { url } = req.query;

  const VideoCode = getYouTubeVideoId(url);
 
  axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${VideoCode}&key=${YOUTUBE_APIKEY}&part=snippet,statistics`)
  .then(response => {
      const { items } = response.data;
      if(items.length>0){

          var videoData = {
            videoUrl: url,
            id: items[0].id,
            title: items[0].snippet.title,
            description: items[0].snippet.description,
            thumbnails:  items[0].snippet.thumbnails.standard.url,
            publishedAt: items[0].snippet.publishedAt,
            channel:{ 
              channelId: items[0].snippet.channelId,
              channelTitle: items[0].snippet.channelTitle,
            },
            statistics:{ 
              viewCount:  items[0].statistics.viewCount,
              likeCount:  items[0].statistics.likeCount,
              favoriteCount: items[0].statistics.favoriteCount,
              commentCount: items[0].statistics.commentCount
            }
          }

          axios.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${items[0].snippet.channelId}&key=${YOUTUBE_APIKEY}`)
          .then(response => {
              const { items } = response.data;
              if(items.length>0){

                  videoData['channel'] = {
                    channelId: items[0].id,
                    channelTitle: items[0].snippet.title,
                    thumbnails: items[0].snippet.thumbnails.default.url,
                    description: items[0].snippet.description,
                    customUrl: items[0].snippet.customUrl,
                    publishedAt: items[0].snippet.publishedAt
                  }
                  res.status(200).send({
                    status: true,
                    result: videoData,
                    errors: "",
                  });
              }else{
                res.status(500).send({
                  status: false,
                  result: "",
                  errors: " Wrong channel Url "
                });
                
              }
          })
          .catch(error => {
            res.status(500).send({
              status: false,
              result: "",
              errors: " Error fetching youtube channel data: " + error,
              errorData: error,
            });
             
          });
                  
      }else{
        res.status(500).send({
          status: false,
          result: "",
          errors: " Wrong Video Url",
        });
      }
      
  })
  .catch(error => {
    res.status(500).send({
      status: false,
      result: "",
      errors: " Error fetching youtube video data: " + error,
      errorData: error,
    });
      console.error(':', error);
  });


}

exports.getYoutubeVideoCommets = async (req, res) => {
  const  { url } = req.query;

  const VideoCode = getYouTubeVideoId(url);
 
  axios.get(`https://youtube.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${VideoCode}&key=${YOUTUBE_APIKEY}`)
  .then(response => {
      if(response.data.items.length){
        var comments = [];
        response.data.items.map((item)=>{
          const comment = {
            comment: item.snippet.topLevelComment.snippet.textOriginal,
            authorDisplayName: item.snippet.topLevelComment.snippet.authorDisplayName,
            authorProfileImageUrl: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
            authorChannelUrl: item.snippet.topLevelComment.snippet.authorChannelUrl,
            authorChannelId: item.snippet.topLevelComment.snippet.authorChannelId.value
          }
          comments.push(comment);

        })
          
        res.status(200).send({
          status: true,
          result: comments,
          errors: "",
        });    
      }else{
        res.status(500).send({
          status: false,
          result: "",
          errors: " Error fetching youtube video data ",
          errorData: error,
        });
      }
      
  })
  .catch(error => {
    res.status(500).send({
      status: false,
      result: "",
      errors: " Error fetching youtube video data: " + error,
      errorData: error,
    });
      console.error(':', error);
  });


}

function getYouTubeVideoId(url) {
  // Regular expression to match YouTube URLs
  var regExp = /(?:\?v=|\/embed\/|\/watch\?v=|\/(?:embed|v)\/|\/(?:c|v)\/|\/ytscreeningroom\?v=|\/shares\?.+\/)([a-zA-Z0-9_-]{11})/i;
  
  // Try to match the video ID in the URL
  var match = url.match(regExp);

  // If there's a match, return the video ID, otherwise return null
  if (match && match[1]) {
    return match[1];
  } else {
    // Handle invalid URLs or other cases
    return null;
  }
}


exports.getGiveawayWinner = async (req, res) => {
  const { GiveawayData, GiveawaySetting } = req.body;
  
  //const user_id = req.user.userId;
  const user_id = 1;
  var winners = [];
  var substitutes = [];
  try {

    
    if(GiveawayData!==null && GiveawaySetting!==null ){

      if(GiveawayData.GiveawayCode==null){

        var participants = GiveawayData.Participants;
        shuffleArray(participants);

        const maxWinners = Math.min(GiveawaySetting.Winners, participants.length);
        winners = participants.slice(0, maxWinners);

        // To exclude winners from substitutes
        const restParticipants = participants.filter(item => !winners.includes(item));
        
        //declare Substitute Participants
        const maxSubstitutes = Math.min(GiveawaySetting.Substitutes, restParticipants.length);
        substitutes = restParticipants.slice(0, maxSubstitutes);


        const giveaway_code =  generateRandomCode(6);
        const validity = new Date();
        validity.setDate(validity.getDate() + 60);
        const insert_sql =
        "INSERT INTO `giveaway_details` SET user_id =?, giveaway_code=?, giveaway_type=?, giveaway_post=?, giveaway_title=?, total_participants=?, giveaway_postdata=?, winners=?, substitutes=?, participants=?, validity=?";
        const result = await db.query(insert_sql, [
          user_id,
          giveaway_code,
          GiveawayData.Giveaway,
          GiveawayData.VideoUrl,
          GiveawayData.Title,
          GiveawayData.ParticipantCount,
          JSON.stringify(GiveawayData.PostData),
          JSON.stringify(winners),
          JSON.stringify(substitutes),
          JSON.stringify(participants),
          validity
        ]);
        if (result.insertId > 0) {
          let resObj = {
            winners: winners,
            substitutes: substitutes,
            giveaway_code: giveaway_code
          };
          res.status(200).send({
            status: true,
            result: resObj,
            message: "Giveaway winners",
            errors: "",
          });
        } else {
          res.status(200).send({
            status: false,
            result: "",
            message: "",
            errors: "Some issue in declaring winner",
          });
        }
      
      }else{

        const SQL = "SELECT * FROM `giveaway_details` WHERE user_id=? AND giveaway_code=? AND giveaway_type=?";
        const result = await db.query(SQL, [user_id, GiveawayData.GiveawayCode, GiveawayData.Giveaway]);

        if(result.length)
        {
          let resObj = {
            winners: JSON.parse(result[0].winners),
            substitutes: JSON.parse(result[0].substitutes),
            giveaway_code: result[0].giveaway_code
          };
          res.status(200).send({
            status: true,
            result: resObj,
            message: "Giveaway winners",
            errors: "",
          });
        }else{
            res.status(500).send({
              status: false,
              result: "",
              errors: " Invalid Data " ,
              errorData: error,
            });
        }
      }
    }else{
      res.status(500).send({
        status: false,
        result: "",
        errors: " Invalid Data " ,
        errorData: error,
      });
    }
    
    
  } catch (error) {
    res.status(500).send({
      status: false,
      result: "",
      errors: " Error: " + error,
      errorData: error,
    });
  }
};

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function generateRandomCode(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }
  return code;
}

exports.getGiveawayResult = async (req, res) => {
  const { code } = req.params;

  try{
    const SQL = "SELECT g.*, u.first_name, u.last_name  FROM `giveaway_details` g, `users` u WHERE u.id=g.user_id AND g.giveaway_code=? ";
    const result = await db.query(SQL, [code]);
   
    if(result.length>0)
    {
      const giveaway_postdata = JSON.parse(result[0].giveaway_postdata);
      let resObj = {
        Code: result[0].giveaway_code,
        Type: result[0].giveaway_type,
        GiveawayUrl: 'https://youtu.be/'+getYouTubeVideoId(result[0].giveaway_post),
        Title: result[0].giveaway_title,
        Author: {
          UserId:result[0].user_id,
          FirstName: result[0].first_name,
          LastName: result[0].last_name,
          ChannelImage: giveaway_postdata.channel.thumbnails,
          ChannelId: giveaway_postdata.channel.channelId,
          ChannelTitle: giveaway_postdata.channel.channelTitle,
          ChannelUrl: 'https://www.youtube.com/channel/'+giveaway_postdata.channel.channelId
        },
        TotalParicipants: result[0].total_participants,
        Winners: JSON.parse(result[0].winners),
        Substitutes: JSON.parse(result[0].substitutes),
        Validity: result[0].validity,
        CreateDate: result[0].created_at
      };
      res.status(200).send({
        status: true,
        result: resObj,
        message: "Giveaway Result",
        errors: "",
      });
    }else{
        res.status(200).send({
          status: false,
          result: "",
          errors: "Invalid code" ,
          errorData: error,
        });
    }
  } catch (error) {
    res.status(200).send({
      status: false,
      result: "",
      errors: "This giveaway certificate is not exists" ,
      errorData: error,
    });
  }
}

exports.getGiveawayResultImage = async (req, res) => {
  const { code } = req.params;

  try{
    const SQL = "SELECT g.*, u.first_name, u.last_name  FROM `giveaway_details` g, `users` u WHERE u.id=g.user_id AND g.giveaway_code=? ";
    const result = await db.query(SQL, [code]);
   
    if(result.length>0)
    {
      let resObj = {
        Code: result[0].giveaway_code,
        Type: result[0].giveaway_type,
        GiveawayUrl: result[0].giveaway_post,
        Title: result[0].giveaway_title,
        Author: {
          UserId:result[0].user_id,
          FirstName: result[0].first_name,
          LastName: result[0].last_name,
        },
        TotalParicipants: result[0].total_participants,
        Winners: JSON.parse(result[0].winners),
        Substitutes: JSON.parse(result[0].substitutes),
        Validity: result[0].validity,
        CreateDate: result[0].created_at
      };
      res.status(200).send({
        status: true,
        result: resObj,
        message: "Giveaway Result",
        errors: "",
      });
    }else{
        res.status(200).send({
          status: false,
          result: "",
          errors: "Invalid code" ,
          errorData: error,
        });
    }
  } catch (error) {
    res.status(200).send({
      status: false,
      result: "",
      errors: "This giveaway certificate is not exists" ,
      errorData: error,
    });
  }
}