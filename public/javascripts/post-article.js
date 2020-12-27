function addKeyword(){
    $("#keyword-fields").append(`<div class="input-block">
                                    <input type="text" name="keyword" class="form-control d-inline-block" required>
                                    <button type="button" class="btn btn-sm btn-danger d-inline-block" onclick="removeKeyword(this)">-</button>
                                </div>`);
};
function removeKeyword(btn){
    if($("#keyword-fields .input-blokc").length >1){
        $(btn).closest(".input-block").remove();
    }
}

function addAuthorName(){
    $("#author-book-names").append(`<div class="input-block">
                                        <input type="text" name="bookAuthorName" class="form-control d-inline-block" maxlength="100" required>
                                        <button type="button" class="btn btn-sm btn-danger d-inline-block" onclick="removeAuthor(this)">-</button> 
                                    </div>`);
}

function removeAuthor(btn){
    $(btn).closest(".input-block").remove();
}

$("#article-type").on("change", function(){
    if($(this).val()=="review"){
        $("#submit-btn").remove();
        $("#post-article-form").append(   `<div class="card" id="book-info">
                                <div class="card-header bg-secondary">
                                    Thông tin sách phản biện
                                </div>                        
                                <div class="card-body">
                                    <div class="form-group">
                                        <label>Tiêu đề</label>
                                        <input type="text" name="bookName" class="form-control" maxlength="50" minlength="5"  required> 
                                    </div>
                                    <div class="form-group">
                                        <label>ISBN</label>
                                        <input type="text" name="isbn" class="form-control" maxlength="12" minlength="12"  required> 
                                    </div>
                                    <div class="form-group">
                                        <label>Các tác giả</label>
                                        <button type="button" class="btn btn-sm btn-success" onclick="addAuthorName()">+</button>
                                        <div id="author-book-names">
                                            <div class="input-block">
                                                <input type="text" name="bookAuthorName" class="form-control d-inline-block" maxlength="100"  required>
                                                <button type="button" class="btn btn-sm btn-danger d-inline-block" onclick="removeAuthor(this)">-</button> 
                                            </div>    
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>Nhà xuất bản</label>
                                        <input type="text" name="publisher" class="form-control" maxlength="50"> 
                                    </div>
                                    <div class="form-group">
                                        <label>Năm xuất bản</label>
                                        <input type="number" name="publishYear" class="form-control" min="1990" max="2020" step="1" value="2020"> 
                                    </div>
                                    <div class="form-group">
                                        <label>Số trang</label>
                                        <input type="number" name="numberPage" class="form-control" min="10" max="900" step="1" value="10"> 
                                    </div>
                                </div>
                            </div>
                        <div class="d-flex justify-content-end mt-2" id="submit-btn">
                            <button type="submit" class="btn btn-success mr-3">Đăng bài</button>
                            <button type="reset" class="btn btn-danger mr-3">Hủy</button>
                        </div>`);
    }
    else{
        $("form #book-info").remove();
    }
});

function addAuthorArticle(){
    let lastSelect = $('#author-article-names div').last().children("select");
    if($(lastSelect).children("option").length>1){
        let clone = $(lastSelect).clone();
        $(lastSelect).prop("disabled", true);
        let inputBlock = $('<div class="input-block"><button type="button" class="btn btn-sm btn-danger d-inline-block" onclick="removeAuthorArticle(this)">-</button></div>');
        $(clone).children(`option[value="${$(lastSelect).val()}"]`).remove();
        $(inputBlock).prepend($(clone));
        $("#author-article-names").append($(inputBlock));
        $("#add-author-article-btn").prop("disabled", true);
    }                
}

function removeAuthorArticle(btn){
    if($("#author-article-names select").length>1){
        $(btn).closest(".input-block").remove();
        $("#author-article-names div:last-child").children("select").prop("disabled", false);
        $("#add-author-article-btn").prop("disabled", false);
    }
}

$("#FileUploader").change(function () {
    var fileExtension = ['pdf', 'doc', 'docx', 'txt'];
    if ($.inArray($(this).val().split('.').pop().toLowerCase(), fileExtension) == -1) {
        alert("Only formats are allowed : "+fileExtension.join(', '));
        $(this).val('');
    }
});

$("#post-article-form").submit(function(){
    var SSNValues = [];
    var keywordValues = [];
    $('select[name="authorArticleSSN"]').each((idx, selectTag)=>{
        console.log($(selectTag).val());
        SSNValues.push($(selectTag).val());
    })

    var SSNinput = $("<input>").attr("type", "hidden").attr("name", "SSNValues").val(SSNValues);
    $("#post-article-form").append(SSNinput);
    console.log("Before submit");
    return true;
});