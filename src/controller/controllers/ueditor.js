var fs = require('fs');

exports.imgManager = function(req, res) {
    var str = '';
    var i = 0;
    fs.readdir(__dirname + 'src/web/public/images/uploads', function(err, files) {
        if (err) throw err;

        var total = files.length;

        files.forEach(function(file) {
            str += file + 'ue_separate_ue';
            i++;

            // send file name string when all files was processed
            if(i === total) {
                res.end(str);
            }
        });
    });

};

exports.imgUp = function(req, res) {
    var title = req.body.pictitle;
    var img = req.files.upfile;
    var imgPubPath = '/images/uploads/' + img.name;
    var imgAbsPath = __dirname + 'src/web/public' + imgPubPath;

    fs.rename(img.path, imgAbsPath, function(err) {
        if (err) throw err;

        res.json({
            'url': imgPubPath,
            'title': title,
            'original': img.name,
            'state': 'SUCCESS'
        });
    });
}