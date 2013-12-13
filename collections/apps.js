Apps = new Meteor.Collection('apps');

Apps.allow({
  update: ownsDocument,
  remove: ownsDocument
});



Meteor.methods({
  app: function(appAttributes) {
    appAttributes.url = normalizeAppURL(appAttributes.url);
    appAttributes.source = normalizeAppURL(appAttributes.source);

    var user = Meteor.user(), // ensure the user is logged in
      appWithSameLink = Apps.findOne({url: appAttributes.url});

    if (!user) {
      if (Meteor.isServer) {
        throw new Meteor.Error(401, "Doh! You need to login to share your app.");
      } else {
        Meteor.loginWithGithub(function (err) {
          if (!err)
            Meteor.call('app', appAttributes);
        });
        return;
      }
    }

    // ensure the app has a title
    if (!appAttributes.title)
      throw new Meteor.Error(422, 'Oh snap! Your app needs a name. I hope it has one.');

    // check that there are no previous apps with the same link
    if (appAttributes.url && appWithSameLink) {
      throw new Meteor.Error(302, 
        'Oops! Looks like this app has already been shared. Give it some <3!', 
        appWithSameLink._id);
    }

    // pick out the whitelisted keys
    var app = _.extend(_.pick(appAttributes, 'url', 'title', 'source','description','pkgs'), {
      userId: user._id, 
      author: user.profile.name, 
      submitted: new Date().getTime(),
      commentsCount: 0,
      upvoters: [], 
      votes: 0,
      score: 0,
    });

    var appId = Apps.insert(app);

    return appId;
  },
  
  upvote: function(appId){
    var user = Meteor.user(); //ensure user is logged in
    if (!user) {
      if (Meteor.isServer) {
        throw new Meteor.Error(401, "You need to login to upvote");
      } else {
        Meteor.loginWithGithub(function (err) {
          if (!err)
            Meteor.call('upvote', appId);
        });
        return;
      }
    }
    
    var app = Apps.findOne(appId);

    if (!app)
      throw new Meteor.Error(422, 'App not found');
    if (_.include(app.upvoters, user._id))
      return;
      // throw new Meteor.Error(422, 'Already upvoted this app');
    Apps.update({
        _id: appId, 
        upvoters: {$ne: user._id}
      }, {
        $addToSet: {upvoters: user._id},
        $inc: {votes: 1},
    });
    Apps.update({
        _id: appId, 
      }, {
        $inc: {score: 1},
    });
  },
});

if (Meteor.isServer) {

}
