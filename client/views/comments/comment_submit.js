Template.commentSubmit.events({
  'submit form': function(e, template) {
    e.preventDefault();

    //build the comment from its parts
    var $body     = $(e.target).find('[name=body]');
    var comment = {
      body:     $body.val(),
      appId:    template.data._id,
      children: []
    };

    if (Meteor.userId()) {
      doPostComment (comment, $body, template.data.appId);
    } else {
        Meteor.loginWithMeteorDeveloperAccount(function (err) {
        if (!err){
          doPostComment (comment, $body, template.data.appId);
        }
      });
    };
    
  }
});

function doPostComment (comment, $body, trueAppId) {
  var isChild = Session.equals('comment-id', comment.appId);

  if (isChild) {    //do this for the child version
        //the call above actually returned the parentComment id
      comment.parentComment = comment.appId; //for child comments

      console.log(trueAppId);
        //put the correct appId into comment.appId
      comment.appId = trueAppId;

      postComment(comment, $body, isChild); 
  } else{           //do this for root comment
      comment.parentComment = null; //set parent to null
      postComment(comment, $body, isChild);
  };
}

function postComment(comment, $body, isChild){ //post the comment
  Meteor.call('comment', comment, function(error, commentId) {
      if (error){
        throwError(error.reason);
      } else {
        $body.val('');  //if it's a child comment, the parent
        if (isChild){   //will get its commentId in an array
          Meteor.call('notifyParents', comment, commentId);
        }
      }
  });
  Session.set('comment-id', null);
};
