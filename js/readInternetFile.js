ReadInternetFile = function(_url){
    this.url = _url;
}

ReadInternetFile.prototype.read = function(){
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", this.url, false);
    rawFile.withCredentials = false;
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;
                lines=[];
                lines = allText.split('\n');
            }
        }
    }
    rawFile.send(null);
}