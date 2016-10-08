/**
* Authentication
* @namespace thinkster.authentication.services
*/
(function() {
  'use strict';

  angular.module('thinkster.authentication.services').factory('Authentication', Authentication);

  Authentication.$inject = ['$cookies', '$http'];

  /**
  * @namespace Authentication
  * @returns {Factory}
  */
  function Authentication($cookies, $http) {
    /**
    * @name Authentication
    * @desc The Factory to be returned
    */
    var Authentication = {
      register: register
    };

    return Authentication;

    ////////////////////

    /**
    * @name register
    * @desc Try to register a new user
    * @param {string} username The username entered by the user
    * @param {string} password The password entered by the user
    * @param {string} email The email entered by the user
    * @returns {Promise}
    * @memberOf thinkster.authentication.services.Authentication
    */
    function register(email, password, username) {
      return $http({
        method: 'POST',
        url: '/api/v1/accounts/',
        data: {
          username: username,
          password: password,
          email: email
        }
      }).success(function(data, status, headers, config) {
        console.log("response");
        alert(data);
      }).error(function(data, status, headers, config) {
        alert("error: " + status);
      });
    }
  }
})();
