# WallRizzFox  
A Firefox add-on that changes its theme dynamically.

![ezgif com-animated-gif-maker(4)](https://github.com/user-attachments/assets/2596446d-0da4-47bd-90f6-82d857a43865)

## Requirements  
- Add the add-on from Firefox's add-on page.  
- Download the native app from the GitHub release page, grant executable permissions, and run the app using `sudo WallRizzFox` to generate the app manifest for Firefox. Then move the binary to `/usr/bin/`.  
- Install and set up [WallRizz](https://github.com/5hubham5ingh/wallrizz).  
- Install the Firefox theme extension for WallRizz. Run `WallRizz -t` to download from a list of extensions.


## FAQ  

**1. How to change the native app installation path?**  
Run `sudo WallRizzFox /path/to/the/installed/binary`, then move the binary to the specified location.  

**2. How to enable/disable the browser add-on?**  
Click on the browser action button of the WallRizzFox add-on to toggle between enabling and disabling it.  

**3. Debugging?**  
Navigate to `about:debugging#/runtime/this-firefox` in Firefox and click the `inspect` button for the WallRizzFox add-on to view logs and errors for both the add-on and the native app.  
