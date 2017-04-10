# Aeolus Client

This is the VirES for Aeolus client. It is based on the VirES for Swarm client.
It is a framework which integrates, extends and configures multiple libraries.

## Technologies used

* [Grunt](http://gruntjs.com/) : task runner allowing allows building, previewing and testing the project
* [Bower](http://bower.io/) : package manager for dependencies 

## Base libraries used

* [require](http://requirejs.org/)
* [Underscore](http://underscorejs.org/)
* [jQuery](http://jquery.com/)
* [Backbone](http://backbonejs.org/)
* [Backbone Marionette](http://marionettejs.com/)
* [Hanldebars](http://handlebarsjs.com/)

## How to setup development environmet (on a Linux machine)

0.  Get the code from GitHub [Aeolus Client repository](https://github.com/ESA-VirES/Aeolus-Client):

    ```
    git clone git@github.com:ESA-VirES/Aeolus-Client.git
    ```

0.  Install development enviroment: 

    Make sure [Node.js](http://nodejs.org) and [NPM](https://npmjs.org) are installed
    on your machine and run:

    ```
    cd ./Aeolus-Client
    sudo npm install -g grunt-cli
    sudo npm install -g bower 
    npm install 
    ```

    These commands install the needed Node.js packages. In case of any trouble try to use 
    reasonable recent version of Node.js. Also note that newer versions of Node.js contain 
    the NPM already bundled in the baseline installation. 
    Possible other dependencies needed:
    * ruby

    ```
    sudo apt-get install ruby rubygems-integration ruby-dev
    ```
    * compass 
    ```
    sudo gem install compass
    ```
    
0.  Install client dependencies:  

    The required JavaScript librabries can be installed by: 

    ```
    bower install
    ```

0.  Start the [Grunt](http://gruntjs.com/) development server:

    ```
    grunt server 
    ```

    this should automatically open a the client on your default web browser, if not point your browser to localhost:9000. 

If you managed to reach this the last step you can start to hack the code. 
The development server by grunt watches for saved changes in the code and will update the page automatically.


## How to deploy the code on a the server 

0.  Create deployment package: 

    ```
    grunt build
    ```

    This command creates `dist` directory containing the produced deployment 
    version. This directory should be then packed by some archiving tool (`zip`, `tar`, `cpio` ... etc.)
    creating the deployment package.

0.  Put the content of the deployment package to your server and make sure
    the web server can access the `index.html` file. 
